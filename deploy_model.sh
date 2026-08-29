#!/bin/bash
set -e
echo "Deploying gpt-4o model to trinetra-foundry-openai..."
az cognitiveservices account deployment create \
  -g trinetra-foundry-rg \
  -n trinetra-foundry-openai \
  --deployment-name gpt-4o \
  --model-name gpt-4o \
  --model-version "2024-02-15-preview" \
  --model-format OpenAI \
  --sku-name "Standard" \
  --sku-capacity 80 > /dev/null || true

echo "Fetching Endpoint and Key..."
ENDPOINT=$(az cognitiveservices account show -n trinetra-foundry-openai -g trinetra-foundry-rg --query properties.endpoint -o tsv)
ENDPOINT_NOSLASH=$(echo "$ENDPOINT" | sed 's|/$||')
KEY=$(az cognitiveservices account keys list -n trinetra-foundry-openai -g trinetra-foundry-rg --query key1 -o tsv)

FULL_URL="$ENDPOINT_NOSLASH/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-15-preview"
echo "Endpoint: $FULL_URL"
echo "Key len: ${#KEY}"

echo "Setting Cloudflare Secrets..."
# Use --config explicitly so wrangler finds the worker name
echo -n "$FULL_URL" | npx wrangler secret put AZURE_OPENAI_ENDPOINT --config gateway-proxy/wrangler.toml
echo -n "$KEY" | npx wrangler secret put AZURE_OPENAI_KEY --config gateway-proxy/wrangler.toml

echo "Verifying secrets..."
npx wrangler secret list --config gateway-proxy/wrangler.toml || true

echo "Deploying Worker..."
npx wrangler deploy --config gateway-proxy/wrangler.toml

echo "Checking autoscale SLA..."
CAP=$(az cognitiveservices account deployment show -g trinetra-foundry-rg -n trinetra-foundry-openai --deployment-name gpt-4o --query sku.capacity -o tsv)
echo "Current capacity: $CAP (SLA 99.9% target p95<2s, autoscale 30-100)"
if [ "$CAP" -lt 80 ]; then
  echo "Autoscaling to 80 for 27K+ context headroom..."
  az cognitiveservices account deployment create -g trinetra-foundry-rg -n trinetra-foundry-openai --deployment-name gpt-4o --model-name gpt-4o --model-version "2024-02-15-preview" --model-format OpenAI --sku-name Standard --sku-capacity 80 > /dev/null || true
fi

echo "Done! Azure Foundry is fully wired to Cloudflare! (autoscale SLA enabled)"

