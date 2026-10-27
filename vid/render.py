import os
ROOT = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(ROOT)
import os, sys, subprocess, shutil
from playwright.sync_api import sync_playwright
v = int(sys.argv[1]); ver = sys.argv[2]; mode = sys.argv[3] if len(sys.argv) > 3 else 'video'
fps = 25
D = f'{ROOT}/vid/f{v}{ver}'
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1920, 'height': 1080})
    pg.goto(f'file://{ROOT}/vid/v{v}.html?ver={ver}'); pg.wait_for_timeout(600)
    total = pg.evaluate('window.TOTAL'); ts = 0; sl = 1
    errs = pg.evaluate('window.__err || null')
    if mode == 'check':
        print('real total', (total - ts) * sl)
        rs = [float(x) for x in sys.argv[4].split(',')]
        print(pg.evaluate('JSON.stringify(window.STOPS_INFO)'))
        for t in rs:
            pg.evaluate(f'setT({ts + t / sl},{t})'); pg.screenshot(path=f'/tmp/claude-0/k_v{v}{ver}_{t}.jpg', type='jpeg', quality=80)
    else:
        shutil.rmtree(D, ignore_errors=True); os.makedirs(D)
        n = int((total - ts) * sl * fps)
        for i in range(n):
            pg.evaluate(f'setT({ts + i / fps / sl},{i / fps})'); pg.screenshot(path=f'{D}/f{i:04d}.jpg', type='jpeg', quality=93)
    b.close()
if mode != 'check':
    names = {1: 'IoT_1_Red_Alert_Field_Fix', 2: 'IoT_2_Red_Alert_Auto_Resolve', 3: 'IoT_3_Yellow_Alert_Dashboard', 4: 'IoT_4_Live_Telemetry_Dashboard', 5: 'IoT_5_ServiceNow_Down_Parked_Replay', 6: 'IoT_6_Backlog_Lag_Rising', 7: 'IoT_7_Health_Check', 8: 'IoT_8_Multi_Tenancy'}
    out = f'{ROOT}/vid/out/{names[v]}_{"Interview" if ver=="int" else "LinkedIn"}.mp4'; os.makedirs(f'{ROOT}/vid/out', exist_ok=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', f'{D}/f%04d.jpg', '-c:v', 'libx264', '-crf', '20', '-preset', 'medium',
                    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], check=True)
    print(out, round((total - ts) * sl, 1), 's')
