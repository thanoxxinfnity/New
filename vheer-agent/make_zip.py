import json, subprocess, zipfile, glob, os, sys
out = "out/batch"
files = sorted(glob.glob(out + "/*.mp4"))
rows = ["file\tsize\tresolution\tduration"]
for f in files:
    j = json.loads(subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=width,height:format=duration,size","-of","json",f],capture_output=True,text=True).stdout)
    s = j["streams"][0]
    rows.append(f"{os.path.basename(f)}\t{int(j['format']['size'])/1048576:.2f} MB\t{s['width']}x{s['height']}\t{float(j['format']['duration']):.1f}s")
open(out + "/videos_list.txt", "w").write("\n".join(rows) + "\n")
dest = sys.argv[1]
with zipfile.ZipFile(dest, "w", zipfile.ZIP_STORED) as z:
    for f in files: z.write(f, os.path.basename(f))
    z.write(out + "/videos_list.txt", "videos_list.txt")
print("\n".join(rows)); print(len(files), "videos ->", dest)
