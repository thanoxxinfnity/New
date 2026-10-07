import json, os, shutil, subprocess, sys, time
from gradio_client import Client, handle_file

SPACE = "Lightricks/ltx-video-distilled"
SUFFIX = "hand-drawn 2D anime style, smooth fluid animation, static camera, no text"
NEG = "worst quality, inconsistent motion, blurry, jittery, distorted, text, watermark"
OUT = "out/batch"
BASE = {"A": "out/base_A.jpg", "B": "out/base_B.jpg"}
MIN_BYTES = 500 * 1024

M = [
 ("locomotion","walk_forward","A","The character walks toward the camera"),
 ("locomotion","run_fast","A","The character runs fast down the street, arms swinging"),
 ("locomotion","jog_slow","B","The character jogs slowly, breathing heavily"),
 ("locomotion","look_back","A","The character stops suddenly and looks back over their shoulder"),
 ("locomotion","jump_land","B","The character jumps up and lands lightly on both feet"),
 ("locomotion","walk_away","A","The character turns around and walks away from the camera"),
 ("locomotion","climb_stairs","B","The character climbs a few stairs, one step at a time"),
 ("locomotion","stumble_balance","A","The character stumbles, then catches their balance"),
 ("gestures","wave_happy","B","The character waves a hand happily at the camera"),
 ("gestures","point_forward","A","The character points forward with one arm, determined"),
 ("gestures","cross_arms_nod","B","The character crosses their arms and nods"),
 ("gestures","raise_fist","A","The character raises a clenched fist in front of their face"),
 ("gestures","reach_hand","B","The character reaches an open hand toward the camera"),
 ("gestures","shrug","A","The character shrugs both shoulders"),
 ("gestures","adjust_hair","B","The character adjusts their hair with one hand"),
 ("gestures","bow_polite","A","The character bows politely"),
 ("expressions","slow_smile","B","Close-up of the face. The character smiles slowly, eyes brightening"),
 ("expressions","shocked","A","Close-up of the face. The character's eyes widen in shock, mouth slightly open"),
 ("expressions","angry_frown","B","Close-up of the face. The character frowns, eyebrows lowering in anger"),
 ("expressions","sad_eyes","A","Close-up of the face. The character blinks slowly and looks sad, eyes glistening"),
 ("expressions","smirk","B","Close-up of the face. The character smirks confidently"),
 ("expressions","laughing","A","Close-up of the face. The character laughs, shoulders shaking"),
 ("expressions","look_away_back","B","Close-up of the face. The character looks to the left, then slowly back at the camera"),
 ("expressions","calm_exhale","A","Close-up of the face. The character closes their eyes and exhales calmly"),
 ("secondary_motion","strong_wind","A","Strong wind blows the character's hair and jacket to one side"),
 ("secondary_motion","gentle_breeze","B","Gentle breeze moves the hair while the character stands still"),
 ("secondary_motion","skirt_ribbon_run","B","The character's skirt and ribbon flutter as they run"),
 ("secondary_motion","petals_drift","B","Cherry blossom petals drift past the character in the wind"),
 ("secondary_motion","scarf_wave","A","The character's scarf waves in the wind, a slight hair sway"),
 ("secondary_motion","quick_turn","B","The character turns quickly, hair and clothes swinging after the motion"),
]

def probe(p):
    r = subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=width,height:format=duration,size","-of","json",p],capture_output=True,text=True)
    j = json.loads(r.stdout); s = j["streams"][0]
    return dict(w=s["width"], h=s["height"], dur=float(j["format"]["duration"]), size=int(j["format"]["size"]))

os.makedirs(OUT, exist_ok=True)
client = Client(SPACE, token=os.environ["HF_TOKEN"], verbose=False)
report = {}
if os.path.exists(OUT + "/report.json"):
    report = json.load(open(OUT + "/report.json"))

for i, (cat, name, ch, motion) in enumerate(M, 1):
    fn = f"{cat}_{i:02d}_{name}.mp4"
    dest = f"{OUT}/{fn}"
    if fn in report and report[fn].get("ok"):
        continue
    ok = False
    for attempt in (1, 2, 3):
        try:
            t = time.time()
            res = client.predict(prompt=f"{motion}, {SUFFIX}", negative_prompt=NEG,
                input_image_filepath=handle_file(BASE[ch]), input_video_filepath=None,
                height_ui=512, width_ui=896, mode="image-to-video", duration_ui=5,
                ui_frames_to_use=9, seed_ui=42, randomize_seed=True, ui_guidance_scale=1,
                improve_texture_flag=True, api_name="/image_to_video")
            v = res[0]["video"] if isinstance(res[0], dict) else res[0]
            shutil.copy(v, dest)
            info = probe(dest)
            if info["size"] < MIN_BYTES: raise RuntimeError(f"too small {info['size']}")
            if not info["w"] > info["h"]: raise RuntimeError(f"not landscape {info['w']}x{info['h']}")
            report[fn] = dict(ok=True, character=ch, **info)
            print(f"OK {fn} {info['size']//1024}KB {info['w']}x{info['h']} {info['dur']:.1f}s ({time.time()-t:.0f}s)", flush=True)
            ok = True
            break
        except Exception as e:
            msg = str(e)
            print(f"FAIL {fn} try {attempt}: {msg[:200]}", flush=True)
            if os.path.exists(dest): os.remove(dest)
            if "quota" in msg.lower():
                json.dump(report, open(OUT + "/report.json", "w"), indent=1)
                print("QUOTA_EXHAUSTED", flush=True)
                sys.exit(3)
            time.sleep(5)
    if not ok:
        report[fn] = dict(ok=False, character=ch)
    json.dump(report, open(OUT + "/report.json", "w"), indent=1)
print("DONE", sum(1 for v in report.values() if v.get("ok")), "ok of", len(M), flush=True)
