// Generate Fibonacci series
function generateFibonacci(n) {
    const series = [0, 1];
    for (let i = 2; i < n; i++) {
        series.push(series[i - 1] + series[i - 2]);
    }
    return series;
}

// Example usage: Generate first 10 Fibonacci numbers
const fibonacci = generateFibonacci(10);
console.log(fibonacci);