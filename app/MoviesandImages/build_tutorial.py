#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
七福ライフハック 解説動画ビルド
- ナレーション: VOICEVOX 四国めたん ノーマル(id=2) @ localhost:50021
- 字幕: Pillowで透過PNG生成 → ffmpeg overlay で下部に焼き込み
- 画面: 1080x1920 / 30fps / H.264 + AAC
- 1シーン1素材。シーン切替で字幕クリア。改行(=配列の各行)ごとに音声・字幕を区切り、間に休止。
"""
import os, sys, json, wave, struct, subprocess, urllib.request, urllib.parse
from PIL import Image, ImageDraw, ImageFont

BASE = os.path.dirname(os.path.abspath(__file__))
OUT  = os.path.join(BASE, "output")
WORK = os.path.join(OUT, "work")
os.makedirs(WORK, exist_ok=True)

VV   = "http://localhost:50021"
SPK  = 2  # 四国めたん ノーマル
W, H, FPS = 1080, 1920, 30
GAP  = 0.45          # 行間の休止(秒)
TAIL = 0.5           # シーン末尾の余白(秒)
CREAM = "0xE6EFF3"   # ffmpegは0xBBGGRR... 実際は下でcolor=名指定に統一

FONT_SUB  = "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc"
FONT_TITLE= "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc"

# ---- 読み置換(音声用のみ。長い順に適用) ----
READINGS = [
    ("七福よさこい連祝禧", "しちふくよさこいれんいわいめでた"),
    ("祝禧", "いわいめでた"),
    ("七福", "しちふく"),
    ("Bot", "ボット"),
]
def to_speech(text):
    t = text
    for a, b in READINGS:
        t = t.replace(a, b)
    return t

# ---- シーン定義(表示=このまま / 音声=READINGS適用) ----
SCENES = [
    {"asset": "001.jpg", "lines": [
        "これから七福の夏のライフハックアプリの解説を始めます。",
        "アプリの開き方から始めます。",
        "Botで右下の「夏のライフハック」と入力すると出てきます。",
    ], "freeze_intro": True},
    {"asset": "002.mp4", "lines": [
        "そもそも「七福の夏のライフハック」とは何でしょうか？",
        "2022年から、高知のよさこい祭りに初めて参加する人や、久しぶりに高知へ行く人に向けて、七福メンバーが「実際にやってよかった！」という高知の夏のライフハックを募集・共有してきました。",
        "今年は昨年いただいた意見も踏まえて、もっと探しやすい「ミニアプリ」にしました。ぜひ使ってください！",
    ], "freeze_intro": True},
    {"asset": "003.mp4", "lines": [
        "具体的な使い方を説明します。",
        "ライフハックの「食事」をタップしてください。ここでは高知当日に取るべき食事や、飲食関連で気をつけることが書いてあります。",
        "試しにこの「鉄分」と書かれたライフハックを開いてみましょう。タップすると詳細が開きます。",
        "関連リンクを開くと、商品サイトへ移動します。",
    ]},
    {"asset": "004.mp4", "lines": [
        "今度はタグ検索、キーワード検索、お気に入り登録について見てみましょう。",
        "例として、「その他」のライフハックをタップします。",
        "大量のライフハックがあると、お目当てを見つけるのが大変です。",
        "そこでこのタグを使います。例えば「高知市情報」というタグを使うと、このタグが付けられたライフハックがフィルターされます。",
        "他にも、検索窓でキーワード検索もできます。",
        "例えば検索窓で「便利」と打ってみます。すると、ライフハックの本文に「便利」と書かれたものがヒットします。",
        "他にも、後で見返したいライフハックがあれば、お気に入り登録もできます。",
    ], "anchors": [0, 6, 12, 20, 48, 56, 86]},
    {"asset": "005.MP4", "lines": [
        "ライフハックを追加したい場合、アプリの右下の「ライフハックの追加」をタップしてください。",
        "ここで自分の好きなライフハックを追加できます。",
        "追加の際は、フォームの一番上の注意書きを読んでから追加してください。",
    ]},
    {"asset": None, "lines": [
        "これで七福の夏のライフハックアプリの説明を終わります。",
        "ご清聴ありがとうございました。",
    ]},
]

# ---------------- VOICEVOX ----------------
def vv_wav(text, path):
    q = urllib.parse.urlencode({"text": text, "speaker": SPK})
    req = urllib.request.Request(f"{VV}/audio_query?{q}", method="POST")
    query = json.loads(urllib.request.urlopen(req, timeout=60).read())
    query["speedScale"] = 1.0
    query["pauseLengthScale"] = 1.1
    data = json.dumps(query).encode("utf-8")
    req2 = urllib.request.Request(f"{VV}/synthesis?speaker={SPK}", data=data,
                                  headers={"Content-Type": "application/json"}, method="POST")
    wav = urllib.request.urlopen(req2, timeout=120).read()
    with open(path, "wb") as f:
        f.write(wav)

def wav_info(path):
    with wave.open(path, "rb") as w:
        return w.getnframes(), w.getframerate(), w.getnchannels(), w.getsampwidth(), w.readframes(w.getnframes())

# ---------------- 字幕PNG ----------------
def wrap(draw, text, font, maxw):
    lines, cur = [], ""
    for ch in text:
        if ch == "\n":
            lines.append(cur); cur = ""; continue
        if draw.textlength(cur + ch, font=font) <= maxw:
            cur += ch
        else:
            lines.append(cur); cur = ch
    if cur: lines.append(cur)
    return lines

def render_sub(text, path, fontsize=46, maxw=940):
    font = ImageFont.truetype(FONT_SUB, fontsize)
    tmp = Image.new("RGBA", (10, 10)); d = ImageDraw.Draw(tmp)
    lines = wrap(d, text, font, maxw)
    asc, desc = font.getmetrics()
    lh = asc + desc + 10
    tw = max(int(d.textlength(l, font=font)) for l in lines) if lines else 0
    padx, pady = 30, 20
    bw, bh = tw + padx*2, lh*len(lines) + pady*2
    img = Image.new("RGBA", (bw, bh), (0,0,0,0)); dr = ImageDraw.Draw(img)
    dr.rounded_rectangle([0,0,bw-1,bh-1], radius=20, fill=(18,15,12,185))
    y = pady
    for l in lines:
        lw = int(dr.textlength(l, font=font))
        x = (bw - lw)//2
        dr.text((x, y), l, font=font, fill=(250,250,247,255),
                stroke_width=3, stroke_fill=(0,0,0,235))
        y += lh
    img.save(path)
    return bw, bh

def make_title_bg(path):
    img = Image.new("RGB", (W, H), (243,239,230))
    dr = ImageDraw.Draw(img)
    f1 = ImageFont.truetype(FONT_SUB, 92)
    f2 = ImageFont.truetype(FONT_TITLE, 46)
    t1, t2 = "七福ライフハック", "夏のライフハック集"
    dr.text(((W-dr.textlength(t1,font=f1))//2, H//2-150), t1, font=f1, fill=(199,62,58))
    dr.text(((W-dr.textlength(t2,font=f2))//2, H//2-20), t2, font=f2, fill=(120,110,96))
    dr.rectangle([W//2-90, H//2+70, W//2+90, H//2+74], fill=(199,62,58))
    img.save(path)

# ---------------- メイン処理 ----------------
def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print("CMD FAILED:", " ".join(cmd[:6]), "...")
        print(r.stderr[-1500:])
        sys.exit(1)
    return r

def ffprobe_dur(path):
    r = subprocess.run(["ffprobe","-v","error","-show_entries","format=duration",
                        "-of","csv=p=0",path], capture_output=True, text=True)
    return float(r.stdout.strip())

# VOICEVOX wavのフォーマット基準(最初の1本で取得)
print("== VOICEVOX 音声生成 ==")
scene_audio = []   # 各シーンの結合wavパス
scene_subs  = []   # 各シーン [(png, start, end, w, h)]
scene_dur   = []
scene_narr_end = []  # 各シーンのナレーション終了秒(freeze静止尺の算出に使用)
RATE = SW = CH = None

for si, sc in enumerate(SCENES):
    anchors = sc.get("anchors")
    line_wavs = []
    for li, line in enumerate(sc["lines"]):
        wp = os.path.join(WORK, f"s{si}_l{li}.wav")
        if not os.path.exists(wp):           # 音声はキャッシュ(テキスト不変なら再生成しない)
            vv_wav(to_speech(line), wp)
        nf, rate, ch, sw, _ = wav_info(wp)
        if RATE is None: RATE, CH, SW = rate, ch, sw
        line_wavs.append((wp, nf/rate))
        print(f"  S{si+1} L{li+1}: {nf/rate:.2f}s  {line[:24]}")

    # 各行の開始時刻(scene-local)。anchors指定時は素材の動作に合わせ後ろ寄せ(先行させない)
    MINGAP = 0.3
    starts = []
    for li, (wp, dur) in enumerate(line_wavs):
        if li == 0:
            s = max(anchors[0], 0.0) if anchors else 0.0
        else:
            prev_end = starts[li-1] + line_wavs[li-1][1]
            base = prev_end + (MINGAP if anchors else GAP)
            s = max(anchors[li], base) if anchors else base
        starts.append(s)
    narration_end = starts[-1] + line_wavs[-1][1]

    # シーン尺
    freeze = sc.get("freeze_intro")
    is_video = bool(sc["asset"]) and sc["asset"].lower().endswith((".mp4", ".mov"))
    if sc["asset"]:
        vdur = ffprobe_dur(os.path.join(BASE, sc["asset"]))
        if freeze and is_video:
            sdur = (narration_end + 0.6) + vdur   # 静止(ナレーション)→解除して動画を再生
        else:
            sdur = max(vdur, narration_end) + TAIL
    else:
        sdur = narration_end + TAIL

    # 音声を絶対位置で配置(隙間は無音)
    total_bytes = int(round(sdur*RATE)) * CH * SW
    buf = bytearray(total_bytes)
    for li, (wp, dur) in enumerate(line_wavs):
        with wave.open(wp, "rb") as w:
            frames = w.readframes(w.getnframes())
        off = int(round(starts[li]*RATE)) * CH * SW
        if off + len(frames) > total_bytes:
            frames = frames[:total_bytes - off]
        buf[off:off+len(frames)] = frames
    awp = os.path.join(WORK, f"audio_s{si}.wav")
    with wave.open(awp, "wb") as w:
        w.setnchannels(CH); w.setsampwidth(SW); w.setframerate(RATE); w.writeframes(bytes(buf))

    # 字幕: 表示は[開始, 次行開始 or 末]。ただし音声終わり+1.2秒で一旦消す(長い間延びを防ぐ)
    subs = []
    for li, line in enumerate(sc["lines"]):
        png = os.path.join(WORK, f"sub_s{si}_l{li}.png")
        bw, bh = render_sub(line, png)
        st = starts[li]
        nxt = starts[li+1] if li+1 < len(starts) else sdur
        audio_end = starts[li] + line_wavs[li][1]
        en = min(nxt, audio_end + 1.2)
        if en < st + 0.5: en = min(nxt, st + 0.5)
        subs.append([png, st, en, bw, bh])

    scene_audio.append(awp); scene_subs.append(subs); scene_dur.append(sdur)
    scene_narr_end.append(narration_end)
    print(f"  -> Scene{si+1} dur={sdur:.2f}s narr_end={narration_end:.1f}s (asset={sc['asset']})")

# ---- シーン動画(字幕焼き込み・無音) ----
print("== シーン動画生成 ==")
scene_mp4 = []
for si, sc in enumerate(SCENES):
    sdur = scene_dur[si]; subs = scene_subs[si]
    out = os.path.join(WORK, f"scene_{si}.mp4")
    inputs = []
    if sc["asset"]:
        ext = os.path.join(BASE, sc["asset"])
        vdur = ffprobe_dur(ext) if sc["asset"].lower().endswith((".mp4",".mov")) else None
        if sc["asset"].lower().endswith((".jpg",".jpeg",".png")):
            inputs += ["-loop","1","-t",f"{sdur:.3f}","-i",ext]
            base = (f"[0:v]scale={W}:{H}:force_original_aspect_ratio=decrease,"
                    f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color=0xEFEFE6,fps={FPS},setsar=1[base]")
        else:
            inputs += ["-i",ext]
            if sc.get("freeze_intro"):
                # 先頭フレームでナレーション分だけ静止 → その後 動画再生
                fz = scene_narr_end[si] + 0.6
                pad = f",tpad=start_duration={fz:.3f}:start_mode=clone"
            else:
                extra = max(0.0, sdur - vdur)
                pad = f",tpad=stop_mode=clone:stop_duration={extra:.3f}" if extra>0.05 else ""
            base = (f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
                    f"fps={FPS},setsar=1{pad}[base]")
    else:
        title = os.path.join(WORK, "title_bg.png"); make_title_bg(title)
        inputs += ["-loop","1","-t",f"{sdur:.3f}","-i",title]
        base = f"[0:v]scale={W}:{H},fps={FPS},setsar=1[base]"

    # 字幕PNGを入力に追加
    for (png,_,_,_,_) in subs:
        inputs += ["-i", png]
    fc = [base]; cur = "base"
    for k,(png,st,en,bw,bh) in enumerate(subs):
        idx = k+1
        nxt = f"v{k}"
        fc.append(f"[{cur}][{idx}:v]overlay=x=(W-w)/2:y=H-h-130:"
                  f"enable='between(t,{st:.3f},{en:.3f})'[{nxt}]")
        cur = nxt
    filt = ";".join(fc)
    cmd = ["ffmpeg","-y",*inputs,"-filter_complex",filt,"-map",f"[{cur}]",
           "-t",f"{sdur:.3f}","-r",str(FPS),"-pix_fmt","yuv420p",
           "-c:v","libx264","-preset","veryfast","-crf","19","-an",out]
    run(cmd)
    scene_mp4.append(out)
    print(f"  scene_{si}.mp4 done")

# ---- 全体音声(シーン音声を連結) ----
print("== 音声連結 ==")
full_pcm = bytearray()
for awp in scene_audio:
    with wave.open(awp,"rb") as w:
        full_pcm += w.readframes(w.getnframes())
audio_all = os.path.join(WORK,"audio_all.wav")
with wave.open(audio_all,"wb") as w:
    w.setnchannels(CH); w.setsampwidth(SW); w.setframerate(RATE); w.writeframes(bytes(full_pcm))

# ---- 最終: 動画concat + 音声mux ----
print("== 最終合成 ==")
final = os.path.join(OUT, "七福ライフハック_解説.mp4")
inp = []
for m in scene_mp4: inp += ["-i", m]
inp += ["-i", audio_all]
n = len(scene_mp4)
concat = "".join(f"[{i}:v]" for i in range(n)) + f"concat=n={n}:v=1:a=0[v]"
cmd = ["ffmpeg","-y",*inp,"-filter_complex",concat,
       "-map","[v]","-map",f"{n}:a",
       "-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p",
       "-c:a","aac","-b:a","192k","-movflags","+faststart","-shortest",final]
run(cmd)
print("DONE:", final, f"{ffprobe_dur(final):.1f}s")
