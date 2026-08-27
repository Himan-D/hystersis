import pexpect
import time

child = pexpect.spawn('./target/debug/xai-hystersis-pager')
time.sleep(2)
child.sendline('/setup')
time.sleep(2)
print("Screen:")
print(child.before.decode('utf-8') if child.before else "")
child.sendline('\x03') # Ctrl-C
child.close()
