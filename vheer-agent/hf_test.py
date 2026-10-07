import os,shutil,sys,time
from gradio_client import Client, handle_file
t=time.time()
c=Client("Lightricks/ltx-video-distilled", token=os.environ.get("HF_TOKEN"), verbose=False)
res=c.predict(
  prompt="The character walks toward the camera, hand-drawn 2D anime style, smooth fluid animation, static camera, no text",
  negative_prompt="worst quality, inconsistent motion, blurry, jittery, distorted, text, watermark",
  input_image_filepath=handle_file("out/base_A.jpg"),
  input_video_filepath=None, height_ui=512, width_ui=896, mode="image-to-video",
  duration_ui=5, ui_frames_to_use=9, seed_ui=42, randomize_seed=False, ui_guidance_scale=1, improve_texture_flag=True,
  api_name="/image_to_video")
v=res[0]; v=v['video'] if isinstance(v,dict) else v
shutil.copy(v,"out/locomotion_01_walk_forward.mp4")
print("OK",v,round(time.time()-t),"s")
