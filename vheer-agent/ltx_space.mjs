import fs from "node:fs";
import { Client, handle_file } from "@gradio/client";
const TOKEN = process.env.HF_TOKEN;
const ITEMS = [{"file": "locomotion_01_walk_forward.mp4", "char": "loc01", "motion": "The character walks toward the camera"}, {"file": "locomotion_02_run_fast.mp4", "char": "loc02", "motion": "The character runs fast down the street, arms swinging"}, {"file": "locomotion_03_jog_slow.mp4", "char": "loc03", "motion": "The character jogs slowly, breathing heavily"}, {"file": "locomotion_04_look_back.mp4", "char": "loc04", "motion": "The character stops suddenly and looks back over their shoulder"}, {"file": "locomotion_05_jump_land.mp4", "char": "loc05", "motion": "The character jumps up and lands lightly on both feet"}, {"file": "locomotion_06_walk_away.mp4", "char": "loc06", "motion": "The character turns around and walks away from the camera"}, {"file": "locomotion_07_climb_stairs.mp4", "char": "loc07", "motion": "The character climbs a few stairs, one step at a time"}, {"file": "locomotion_08_stumble_balance.mp4", "char": "loc08", "motion": "The character stumbles, then catches their balance"}, {"file": "gestures_09_wave_happy.mp4", "char": "ges09", "motion": "The character waves a hand happily at the camera"}, {"file": "gestures_10_point_forward.mp4", "char": "ges10", "motion": "The character points forward with one arm, determined"}, {"file": "gestures_11_cross_arms_nod.mp4", "char": "ges11", "motion": "The character crosses their arms and nods"}, {"file": "gestures_12_raise_fist.mp4", "char": "ges12", "motion": "The character raises a clenched fist in front of their face"}, {"file": "gestures_13_reach_hand.mp4", "char": "ges13", "motion": "The character reaches an open hand toward the camera"}, {"file": "gestures_14_shrug.mp4", "char": "ges14", "motion": "The character shrugs both shoulders"}, {"file": "gestures_15_adjust_hair.mp4", "char": "ges15", "motion": "The character adjusts their hair with one hand"}, {"file": "gestures_16_bow_polite.mp4", "char": "ges16", "motion": "The character bows politely"}, {"file": "expressions_17_slow_smile.mp4", "char": "exp17", "motion": "Close-up of the face. The character smiles slowly, eyes brightening"}, {"file": "expressions_18_shocked.mp4", "char": "exp18", "motion": "Close-up of the face. The character's eyes widen in shock, mouth slightly open"}, {"file": "expressions_19_angry_frown.mp4", "char": "exp19", "motion": "Close-up of the face. The character frowns, eyebrows lowering in anger"}, {"file": "expressions_20_sad_eyes.mp4", "char": "exp20", "motion": "Close-up of the face. The character blinks slowly and looks sad, eyes glistening"}, {"file": "expressions_21_smirk.mp4", "char": "exp21", "motion": "Close-up of the face. The character smirks confidently"}, {"file": "expressions_22_laughing.mp4", "char": "exp22", "motion": "Close-up of the face. The character laughs, shoulders shaking"}, {"file": "expressions_23_look_away_back.mp4", "char": "exp23", "motion": "Close-up of the face. The character looks to the left, then slowly back at the camera"}, {"file": "expressions_24_calm_exhale.mp4", "char": "exp24", "motion": "Close-up of the face. The character closes their eyes and exhales calmly"}, {"file": "secondary_motion_25_strong_wind.mp4", "char": "sec25", "motion": "Strong wind blows the character's hair and jacket to one side"}, {"file": "secondary_motion_26_gentle_breeze.mp4", "char": "sec26", "motion": "Gentle breeze moves the hair while the character stands still"}, {"file": "secondary_motion_27_skirt_ribbon_run.mp4", "char": "sec27", "motion": "The character's skirt and ribbon flutter as they run"}, {"file": "secondary_motion_28_petals_drift.mp4", "char": "sec28", "motion": "Cherry blossom petals drift past the character in the wind"}, {"file": "secondary_motion_29_scarf_wave.mp4", "char": "sec29", "motion": "The character's scarf waves in the wind, a slight hair sway"}, {"file": "secondary_motion_30_quick_turn.mp4", "char": "sec30", "motion": "The character turns quickly, hair and clothes swinging after the motion"}];
const SUFFIX = "hand-drawn 2D anime style, smooth fluid animation, static camera, no text";
const NEG = "worst quality, inconsistent motion, blurry, jittery, distorted, text, watermark";
const log = (m) => console.log(new Date().toISOString().slice(0, 19), m);
fs.mkdirSync("videos", { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const app = await Client.connect("Lightricks/ltx-video-distilled", { hf_token: TOKEN });
for (const it of ITEMS) {
  const dest = "videos/" + it.file;
  if (fs.existsSync(dest) && fs.statSync(dest).size > 500 * 1024) continue;
  const img = "chars/" + it.char + ".jpg";
  if (!fs.existsSync(img)) { log("NO IMAGE " + img); continue; }
  for (let t = 1; t <= 200; t++) {
    try {
      const r = await app.predict("/image_to_video", {
        prompt: it.motion + ", " + SUFFIX, negative_prompt: NEG,
        input_image_filepath: handle_file(fs.readFileSync(img)), input_video_filepath: null,
        height_ui: 512, width_ui: 896, mode: "image-to-video", duration_ui: 5, ui_frames_to_use: 9,
        seed_ui: 42, randomize_seed: true, ui_guidance_scale: 1, improve_texture_flag: true });
      const v = r.data[0]; const url = (v.video && v.video.url) || v.url;
      const res = await fetch(url, { headers: { Authorization: "Bearer " + TOKEN } });
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 500 * 1024) throw new Error("too small " + buf.length);
      fs.writeFileSync(dest, buf);
      log("OK " + it.file + " " + buf.length);
      break;
    } catch (e) {
      const msg = String((e && e.message) || e);
      if (/quota/i.test(msg)) { log("QUOTA wait 20min :: " + msg.slice(0, 90)); await sleep(20 * 60 * 1000); }
      else { log("FAIL " + it.file + " try " + t + " :: " + msg.slice(0, 120)); await sleep(15000); if (t >= 3) break; }
    }
  }
}
log("FINISHED");
