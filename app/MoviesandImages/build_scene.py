#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
七福ライフハック 解説動画 — シーン単位ビルド
使い方:
  python3 build_scene.py 0        # シーン0を output/scenes/scene_00.mp4 に書き出し
  python3 build_scene.py concat   # output/scenes/scene_*.mp4 を番号順に結合 → output/七福ライフハック_解説.mp4

仕様: VOICEVOX四国めたん(ノーマル,id=2) / 1080x1920 / 下部字幕(透過PNG+overlay) / 改行ごとに区切り休止。
オプション(各シーン辞書):
  "anchors": [秒,...]    行ごとの開始秒(映像に合わせ後ろ寄せ。先行させない)
  "freeze_intro": True   先頭フレームで静止しながらナレーション→終了後に動画再生(動画素材のみ有効)
"""
import os, sys, json, wave, subprocess, urllib.request, urllib.parse
from PIL import Image, ImageDraw, ImageFont

BASE = os.path.dirname(os.path.abspath(__file__))
OUT  = os.path.join(BASE, "output")
SCN  = os.path.join(OUT, "scenes")
WORK = os.path.join(OUT, "work")
for d in (OUT, SCN, WORK): os.makedirs(d, exist_ok=True)

VV   = "http://localhost:50021"
SPK  = 2
W, H, FPS = 1080, 1920, 30
GAP, TAIL = 0.45, 0.5
FONT_SUB   = "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc"
FONT_TITLE = "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc"

READINGS = [
    ("七福よさこい連祝禧", "しちふくよさこいれんいわいめでた"),
    ("祝禧", "いわいめでた"),
    ("七福", "しちふく"),
    ("Bot", "ボット"),
    ("防水", "ぼうすい"),
    ("小噺", "こばなし"),
    ("❤️", "ハート"),
    ("❤", "ハート"),
    ("Google", "グーグル"),
    ("OK", "オーケー"),
    ("５つ", "いつつ"),
    ("その他", "そのた"),
    ("他", "ほか"),
]
def to_speech(t):
    for a, b in READINGS: t = t.replace(a, b)
    # ／ は表示専用の改行マーカー。｜ / | は字幕フェーズ分割マーカー。音声からはすべて除去。
    return t.replace("／", "").replace("/", "").replace("｜", "").replace("|", "").replace("\n", "")

def to_display(t):
    # ／ は「表示だけ改行」。改行(Enter=文の区切り＝別字幕＋間)とは別物
    return t.replace("／", "\n").replace("/", "\n").replace("❤️", "♥").replace("❤", "♥")

# ===== シーン定義(増えたら追記) =====
SCENES = {
    0: {"asset": "001.jpg", "lines": [
        "これから七福の夏のライフハックアプリの解説を始めます。",
        "アプリの開き方から始めます。",
        "Bot右下の「夏のライフハック」をタップして下さい。",
    ], "highlight": {"cx": 938, "cy": 1140, "rx": 138, "ry": 128, "hold": 3.0}},

    1: {"asset": "01.MP4", "freeze_lines": 1, "lines": [
        "夏のライフハックアプリを開きます。",
        "このアプリでは七福メンバーが／実際に試した　／高知と夏のライフハックが／表示されています。",
    ]},

    2: {"asset": "002.png", "lines": [
        "アプリの中央に／ライフハックのカテゴリーが／表示されています。",
        "カテゴリーは「食事」、「衣装・メイク」、／「その他」、「練習」、「お祭り」です。",
        "食事のライフハックは|高知当日の食事や、/熱中症対策が登録されています。",
        "衣装・メイクのライフハックは、|雨対策、防水、衣装関連の／ライフハックが登録されています。",
        "「その他」のライフハックは、|あったら便利なグッズ、高知の豆知識、／小噺などの|多種多様なライフハックが確認できます。",
        "これらのライフハックは、|高知以外の夏祭りで/使えるライフハックが確認できます。",
        "主に夏の練習を乗り切るための／ライフハックが登録されています",
    ], "highlights": [
        {"bbox": (35, 812, 235, 1124), "lines": [2]},      # 食事
        {"bbox": (238, 812, 441, 1124), "lines": [3]},     # 衣装・メイク
        {"bbox": (434, 812, 643, 1124), "lines": [4]},     # その他
        {"bbox": (632, 812, 1031, 1124), "lines": [5, 6]}, # 練習＋お祭り
    ]},

    3: {"asset": "003.MP4", "video_end": 52.5, "pauses": [
        {"at": 0.0,  "lines": [0, 1]},
        {"at": 6.0,  "lines": [2]},
        {"at": 33.0, "lines": [3, 4]},
        {"at": 40.0, "lines": [5]},
        {"at": 52.5, "lines": [6]},
    ], "lines": [
        "次は実際にライフハックの確認方法を/見ていきましょう。",
        "例えば、食事のライフハックを/画面タップしてみましょう。",
        "画面を下にスクロールすると、|これまで登録された／ライフハックが表示されます。",
        "今年からライフハックアプリに/お気に入り機能が追加されました。",
        "後で見返したいライフハックがあれば／❤️マークの「お気に入りに追加」を押してみましょう。",
        "自分がお気に入り登録したライフハックは| フッターの「お気に入り」から確認できます。",
        "お気に入りした／ライフハックが登録されていることを／確認できました",
    ]},

    4: {"asset": "004.MP4", "video_end": 57.0, "pauses": [
        {"at": 0.0,  "lines": [0, 1]},
        {"at": 5.0,  "lines": [2, 3], "arrow": {"tx": 540, "ty": 1285, "dir": "down"}},
        {"at": 21.0, "lines": [4, 5]},
        {"at": 32.0, "lines": [6, 7]},
        {"at": 38.0, "lines": [8, 9]},
        {"at": 41.0, "lines": [10], "arrow": {"tx": 382, "ty": 1028, "dir": "down"}},
        {"at": 57.0, "lines": [11]},
    ], "lines": [
        "次はライフハックアプリの／キーワード検索機能と、／タグ検索機能を見ていきましょう。",
        "今回は「その他」のライフハックで確認します。",
        "検索機能で／探したいライフハックを検索できます。",
        "試しにキーワード検索で「便利」と／入力して検索してみましょう。",
        "ライフハックの本文に|「便利」と記載されたものだけが／ヒットして表示されました。",
        "ヒットしたライフハックを見てみましょう。",
        "確かに本文に「便利」と表示されていますね。",
        "次はタグ検索機能についてです。",
        "ライフハックにはそれぞれ、タグが付いています。｜このタグを使ってライフハックを／絞り込んで検索することもできます。",
        "今回は「高知市情報」のタグがついた／ライフハックを検索してみましょう。",
        "高知市情報のタグをタップすると|そのタグがついたライフハックのみ／表示されるようになります。",
        "このようにタグから/ライフハックを探すことも可能です。",
    ]},

    5: {"asset": "005.MP4", "video_end": 7.0, "pauses": [
        {"at": 0.0, "lines": [0]},
        {"at": 2.0, "lines": [1], "sub_top": True, "arrow": {"tx": 950, "ty": 1610, "dir": "down"}},
        {"at": 7.0, "lines": [2, 3, 4]},
    ], "lines": [
        "ライフハックを新規追加したい場合は、|フッターの右下の「ライフハック追加」をタップして下さい。",
        "このボタンをタップすると、|Googleフォームが開き/ライフハックを新規追加できます。",
        "ライフハックを追加する場合は、|フォームの一番上の注意書きをしっかり読んでからフォームを送信して下さい。",
        "Googleフォームには　|５種類のカテゴリーの質問がありますが|自分が追加したい/カテゴリーのライフハックのみ回答しても構いません。",
        "例えば、「食事」のライフハックを追加したい場合|／回答するのは「食事」関連の質問だけ／回答すればOKです。",
    ]},

    6: {"asset": "006.png", "lines": [
        "これで七福の夏のライフハックアプリの説明を終わります。",
        "不具合や、質問はICにお願いします。",
        "ご清聴ありがとうございました。",
    ]},
}

# ---------- VOICEVOX ----------
def vv_wav(text, path):
    q = urllib.parse.urlencode({"text": text, "speaker": SPK})
    query = json.loads(urllib.request.urlopen(
        urllib.request.Request(f"{VV}/audio_query?{q}", method="POST"), timeout=60).read())
    query["speedScale"] = 1.0
    query["pauseLengthScale"] = 1.1
    data = json.dumps(query).encode()
    wav = urllib.request.urlopen(urllib.request.Request(
        f"{VV}/synthesis?speaker={SPK}", data=data,
        headers={"Content-Type": "application/json"}, method="POST"), timeout=120).read()
    open(path, "wb").write(wav)

def wav_info(path):
    with wave.open(path, "rb") as w:
        return w.getnframes(), w.getframerate(), w.getnchannels(), w.getsampwidth()

# ---------- 字幕PNG ----------
PUNC = set("、。，．！？!?」』）】〉》")
def wrap(d, text, font, maxw):
    # ／由来の \n は強制改行。自動折り返しは直近の句読点の後ろで折る（語の途中で切れにくい）
    lines, cur, last_brk = [], "", 0
    for ch in text:
        if ch == "\n":
            lines.append(cur); cur = ""; last_brk = 0; continue
        cur += ch
        if d.textlength(cur, font=font) > maxw and len(cur) > 1:
            if 0 < last_brk < len(cur):
                lines.append(cur[:last_brk]); cur = cur[last_brk:]
            else:
                lines.append(cur[:-1]); cur = cur[-1]
            last_brk = 0
            for i, c in enumerate(cur):
                if c in PUNC: last_brk = i + 1
        elif ch in PUNC:
            last_brk = len(cur)
    if cur: lines.append(cur)
    return lines

def render_sub(text, path, fontsize=46, maxw=940):
    font = ImageFont.truetype(FONT_SUB, fontsize)
    d0 = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
    lines = wrap(d0, text, font, maxw)
    asc, desc = font.getmetrics(); lh = asc + desc + 10
    tw = max(int(d0.textlength(l, font=font)) for l in lines) if lines else 0
    padx, pady = 30, 20
    bw, bh = tw + padx*2, lh*len(lines) + pady*2
    img = Image.new("RGBA", (bw, bh), (0,0,0,0)); dr = ImageDraw.Draw(img)
    dr.rounded_rectangle([0,0,bw-1,bh-1], radius=20, fill=(18,15,12,185))
    y = pady
    for l in lines:
        x = (bw - int(dr.textlength(l, font=font)))//2
        dr.text((x, y), l, font=font, fill=(250,250,247,255), stroke_width=3, stroke_fill=(0,0,0,235))
        y += lh
    img.save(path)

def sub_phases(line, st, en, pos, tag, li):
    """1行を ｜ で分割し、字幕PNGを複数作って時系列に並べる。
    ｜ がない場合は従来通り単一要素のリストを返す（後方互換）。
    音声は変えない（to_speech で ｜ を除去済み）。
    """
    parts = line.replace("|", "｜").split("｜")  # | (半角) も ｜ (全角) も同じフェーズ分割として扱う
    if len(parts) == 1:
        png = os.path.join(WORK, f"sc{tag}_sub{li}.png")
        render_sub(to_display(line), png)
        return [(png, st, en, pos)]
    char_counts = [len(p.replace("／","").replace("/","").replace("\n","")) for p in parts]
    total = sum(char_counts) or 1
    result = []; t = st
    for i, (p, c) in enumerate(zip(parts, char_counts)):
        phase_en = (t + (c / total) * (en - st)) if i < len(parts) - 1 else en
        png = os.path.join(WORK, f"sc{tag}_sub{li}p{i}.png")
        render_sub(to_display(p), png)
        result.append((png, t, phase_en, pos))
        t = phase_en
    return result

def render_highlight(path, cx, cy, rx, ry):
    # 注目させる赤い丸（白フチ付きで明暗どちらの背景でも目立つ）
    img = Image.new("RGBA", (W, H), (0,0,0,0)); dr = ImageDraw.Draw(img)
    dr.ellipse([cx-rx-4, cy-ry-4, cx+rx+4, cy+ry+4], outline=(255,255,255,235), width=18)
    dr.ellipse([cx-rx, cy-ry, cx+rx, cy+ry], outline=(229,42,33,255), width=12)
    img.save(path)

def render_rect(path, L, T, R, B):
    # 注目させる赤い角丸四角（白フチ付き）
    img = Image.new("RGBA", (W, H), (0,0,0,0)); dr = ImageDraw.Draw(img)
    dr.rounded_rectangle([L-4, T-4, R+4, B+4], radius=20, outline=(255,255,255,235), width=16)
    dr.rounded_rectangle([L, T, R, B], radius=16, outline=(229,42,33,255), width=10)
    img.save(path)

def render_arrow(path, tx, ty, dir="down", length=160):
    # (tx,ty)を先端に指す赤い矢印（白フチ付き）。overlay側でゆらす(ホバー)
    img = Image.new("RGBA", (W, H), (0,0,0,0)); dr = ImageDraw.Draw(img)
    dx, dy = {"down": (0,1), "up": (0,-1), "left": (-1,0), "right": (1,0)}[dir]
    px, py = -dy, dx
    tail = (tx - dx*length, ty - dy*length)
    neck = (tx - dx*46, ty - dy*46)
    for col, wd, hw in [((255,255,255,240), 30, 36), ((229,42,33,255), 18, 26)]:
        dr.line([tail, neck], fill=col, width=wd)
        b1 = (neck[0] + px*hw, neck[1] + py*hw)
        b2 = (neck[0] - px*hw, neck[1] - py*hw)
        dr.polygon([(tx, ty), b1, b2], fill=col)
    img.save(path)

def make_title_bg(path):
    img = Image.new("RGB", (W, H), (243,239,230)); dr = ImageDraw.Draw(img)
    f1 = ImageFont.truetype(FONT_SUB, 92); f2 = ImageFont.truetype(FONT_TITLE, 46)
    dr.text(((W-dr.textlength("七福ライフハック",font=f1))//2, H//2-150), "七福ライフハック", font=f1, fill=(199,62,58))
    dr.text(((W-dr.textlength("夏のライフハック集",font=f2))//2, H//2-20), "夏のライフハック集", font=f2, fill=(120,110,96))
    dr.rectangle([W//2-90, H//2+70, W//2+90, H//2+74], fill=(199,62,58))
    img.save(path)

# ---------- 共通 ----------
def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print("FAILED:", " ".join(cmd[:6]), "...\n", r.stderr[-1500:]); sys.exit(1)
    return r

def ffprobe_dur(path):
    out = subprocess.run(["ffprobe","-v","error","-show_entries","format=duration",
        "-of","csv=p=0",path], capture_output=True, text=True).stdout.strip()
    try: return float(out)
    except ValueError: return 0.0   # 画像(PNG等)は duration=N/A

# ---------- シーン1本をビルド ----------
def build_scene(num):
    sc = SCENES[num]
    anchors = sc.get("anchors")
    tag = f"{num:02d}"
    # 音声(キャッシュ)
    line_wavs = []
    RATE = CH = SW = None
    for li, line in enumerate(sc["lines"]):
        wp = os.path.join(WORK, f"sc{tag}_l{li}.wav")
        if not os.path.exists(wp): vv_wav(to_speech(line), wp)
        nf, RATE, CH, SW = wav_info(wp)
        line_wavs.append((wp, nf/RATE))
        print(f"  L{li+1}: {nf/RATE:.2f}s  {line[:26]}")
    # 開始時刻
    freeze_lines = sc.get("freeze_lines", 0)  # 先頭N行は静止フレーム上で再生→その後動画再生
    MINGAP = 0.3; starts = []; freeze_dur = 0.0
    for li,(wp,dur) in enumerate(line_wavs):
        if li == 0:
            s = 0.0
        elif freeze_lines and li == freeze_lines:
            s = freeze_dur + 0.3                 # 動画再生開始に合わせて再生フェーズ最初の行
        else:
            s = starts[li-1] + line_wavs[li-1][1] + (MINGAP if anchors else GAP)
        if anchors:
            s = max(s, anchors[li])
        starts.append(s)
        if freeze_lines and li == freeze_lines - 1:
            freeze_dur = s + dur + 0.6           # 静止フェーズの長さ(最後の静止行+余白)
    narration_end = starts[-1] + line_wavs[-1][1]
    # 尺
    freeze = sc.get("freeze_intro")
    hl = sc.get("highlight")
    hold = hl.get("hold", 3.0) if hl else 0.0
    is_video = bool(sc["asset"]) and sc["asset"].lower().endswith((".mp4",".mov"))
    if sc["asset"]:
        vdur = ffprobe_dur(os.path.join(BASE, sc["asset"]))
        if freeze and is_video:
            sdur = (narration_end + 0.6) + vdur
        elif freeze_lines and is_video:
            sdur = max(freeze_dur + vdur, narration_end + TAIL)
        else:
            sdur = max(vdur, narration_end + hold) + (0.0 if hl else TAIL)
    else:
        vdur = None; sdur = narration_end + max(TAIL, hold)
    # 音声(絶対配置)
    total = int(round(sdur*RATE))*CH*SW; buf = bytearray(total)
    for li,(wp,dur) in enumerate(line_wavs):
        with wave.open(wp,"rb") as w: frames = w.readframes(w.getnframes())
        off = int(round(starts[li]*RATE))*CH*SW
        if off+len(frames) > total: frames = frames[:total-off]
        buf[off:off+len(frames)] = frames
    awp = os.path.join(WORK, f"sc{tag}_audio.wav")
    with wave.open(awp,"wb") as w:
        w.setnchannels(CH); w.setsampwidth(SW); w.setframerate(RATE); w.writeframes(bytes(buf))
    # 字幕（｜フェーズ分割対応）
    subs = []
    SUB_POS = "x=(W-w)/2:y=H-h-130"
    for li, line in enumerate(sc["lines"]):
        st = starts[li]; nxt = starts[li+1] if li+1 < len(starts) else sdur
        en = min(nxt, st + line_wavs[li][1] + 1.2)
        if en < st + 0.5: en = min(nxt, st + 0.5)
        for entry in sub_phases(line, st, en, SUB_POS, tag, li):
            subs.append(entry)
    # ベース映像
    inputs = []
    if sc["asset"] and sc["asset"].lower().endswith((".jpg",".jpeg",".png")):
        inputs += ["-loop","1","-t",f"{sdur:.3f}","-i", os.path.join(BASE, sc["asset"])]
        base = (f"[0:v]scale={W}:{H}:force_original_aspect_ratio=decrease,"
                f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color=0xEFEFE6,fps={FPS},setsar=1[base]")
    elif sc["asset"]:
        inputs += ["-i", os.path.join(BASE, sc["asset"])]
        if freeze:
            pad = f",tpad=start_duration={narration_end+0.6:.3f}:start_mode=clone"
        elif freeze_lines:
            pad = f",tpad=start_duration={freeze_dur:.3f}:start_mode=clone"
            end_extra = max(0.0, sdur - (freeze_dur + vdur))
            if end_extra > 0.05:
                pad += f":stop_duration={end_extra:.3f}:stop_mode=clone"
        else:
            extra = max(0.0, sdur - vdur)
            pad = f",tpad=stop_mode=clone:stop_duration={extra:.3f}" if extra>0.05 else ""
        base = (f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
                f"fps={FPS},setsar=1{pad}[base]")
    else:
        title = os.path.join(WORK, "title_bg.png"); make_title_bg(title)
        inputs += ["-loop","1","-t",f"{sdur:.3f}","-i", title]
        base = f"[0:v]scale={W}:{H},fps={FPS},setsar=1[base]"
    # オーバーレイ(字幕は下部中央 / ハイライトは全画面PNGを0,0に)
    overlays = list(subs)  # sub_phases により既に4-tuple (png, st, en, pos)
    if hl:  # 単発ハイライト(ナレーション後の丸囲み)
        hlpng = os.path.join(WORK, f"sc{tag}_hl.png")
        render_highlight(hlpng, hl["cx"], hl["cy"], hl["rx"], hl["ry"])
        hl_start = narration_end if hl.get("after_narration", True) else hl.get("start", 0.0)
        overlays.append((hlpng, hl_start, sdur, "x=0:y=0"))
    for hi, h in enumerate(sc.get("highlights", [])):  # 行に同期した複数ハイライト
        lines_idx = h.get("lines", [h.get("line", 0)])
        L0, M0 = min(lines_idx), max(lines_idx)
        hstart = starts[L0]
        hend = starts[M0+1] if M0+1 < len(starts) else sdur
        hpng = os.path.join(WORK, f"sc{tag}_hl{hi}.png")
        if h.get("shape", "rect") == "ellipse":
            render_highlight(hpng, *h["ellipse"])
        else:
            render_rect(hpng, *h["bbox"])
        overlays.append((hpng, hstart, hend, "x=0:y=0"))
    for (png,_,_,_) in overlays: inputs += ["-i", png]
    audio_idx = 1 + len(overlays)
    inputs += ["-i", awp]
    fc = [base]; cur = "base"
    for k,(png,st,en,pos) in enumerate(overlays):
        nxt = f"v{k}"
        fc.append(f"[{cur}][{k+1}:v]overlay={pos}:enable='between(t,{st:.3f},{en:.3f})'[{nxt}]")
        cur = nxt
    out = os.path.join(SCN, f"scene_{tag}.mp4")
    cmd = ["ffmpeg","-y",*inputs,"-filter_complex",";".join(fc),
           "-map",f"[{cur}]","-map",f"{audio_idx}:a","-t",f"{sdur:.3f}","-r",str(FPS),
           "-pix_fmt","yuv420p","-c:v","libx264","-preset","veryfast","-crf","19",
           "-c:a","aac","-b:a","192k","-movflags","+faststart",out]
    run(cmd)
    print(f"  -> {out}  ({sdur:.2f}s, narr_end={narration_end:.1f}s)")

def build_scene_paused(num):
    """動画の特定時刻で一時停止→ナレーション→再生 を繰り返すシーン。
    sc["pauses"] = [{"at": 秒, "lines":[行index,...]}, ...]（atは元動画の時刻・昇順）。
    構成: freeze@at0 → seg[at0→at1] → freeze@at1 → seg[at1→at2] → … → freeze@atN → seg[atN→終わり]
    """
    sc = SCENES[num]; tag = f"{num:02d}"
    asset = os.path.join(BASE, sc["asset"])
    vdur = ffprobe_dur(asset)
    pauses = sc["pauses"]; PAD = 0.5
    video_end = sc.get("video_end", vdur)   # 動画はこの時刻で止める(以降は再生しない)
    appends = sc.get("appends", [])          # 動画の後に追加する静止画クリップ
    SUB_BOTTOM = "x=(W-w)/2:y=H-h-130"; SUB_TOP = "x=(W-w)/2:y=210"
    # 音声(キャッシュ)
    line_wavs = {}; RATE = CH = SW = None
    for li, line in enumerate(sc["lines"]):
        wp = os.path.join(WORK, f"sc{tag}_l{li}.wav")
        if not os.path.exists(wp): vv_wav(to_speech(line), wp)
        nf, RATE, CH, SW = wav_info(wp)
        line_wavs[li] = (wp, nf/RATE)
        print(f"  L{li+1}: {nf/RATE:.2f}s  {line[:24]}")
    # 行ブロックの行内オフセット・尺
    def block_timing(lines):
        offs = []; t = 0.0
        for j, li in enumerate(lines):
            offs.append(t); t += line_wavs[li][1]
            if j != len(lines)-1: t += GAP
        return offs, t + PAD
    for p in pauses: p["_offs"], p["_dur"] = block_timing(p["lines"])
    for ap in appends: ap["_offs"], ap["_dur"] = block_timing(ap["lines"])
    # クリップ列とグローバル開始時刻
    seg_bounds = [p["at"] for p in pauses] + [video_end]
    clips = []; t = 0.0; block_gstart = {}
    for i, p in enumerate(pauses):
        clips.append({"kind": "freeze", "ts": p["at"], "dur": p["_dur"]}); block_gstart[("p", i)] = t
        t += p["_dur"]
        s, e = p["at"], seg_bounds[i+1]
        if e - s > 0.02:
            clips.append({"kind": "seg", "s": s, "dur": e - s}); t += e - s
    for i, ap in enumerate(appends):
        clips.append({"kind": "image", "asset": ap["asset"], "dur": ap["_dur"]}); block_gstart[("a", i)] = t
        t += ap["_dur"]
    total = t
    # 音声・字幕配置
    subs = []; audio_events = []
    def place(block, key, sub_top):
        g0 = block_gstart[key]
        pos = SUB_TOP if sub_top else SUB_BOTTOM
        for j, li in enumerate(block["lines"]):
            gst = g0 + block["_offs"][j]; dur = line_wavs[li][1]
            audio_events.append((gst, line_wavs[li][0]))
            nxt = (g0 + block["_offs"][j+1]) if j < len(block["lines"])-1 else (g0 + block["_dur"])
            en = min(nxt, gst + dur + 1.2)
            for entry in sub_phases(sc["lines"][li], gst, en, pos, tag, li):
                subs.append(entry)
    for i, p in enumerate(pauses): place(p, ("p", i), p.get("sub_top", False))
    for i, ap in enumerate(appends): place(ap, ("a", i), ap.get("sub_top", False))
    # 各クリップ書き出し
    SCALE_VID = (f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
                 f"fps={FPS},setsar=1,format=yuv420p")
    SCALE_IMG = (f"scale={W}:{H}:force_original_aspect_ratio=decrease,"
                 f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color=0xEFEFE6,fps={FPS},setsar=1,format=yuv420p")
    clip_files = []
    for k, c in enumerate(clips):
        cf = os.path.join(WORK, f"sc{tag}_clip{k:02d}.mp4")
        if c["kind"] == "freeze":
            fpng = os.path.join(WORK, f"sc{tag}_frame{k:02d}.png")
            run(["ffmpeg","-y","-ss",f"{c['ts']:.3f}","-i",asset,"-frames:v","1",fpng])
            run(["ffmpeg","-y","-loop","1","-t",f"{c['dur']:.3f}","-i",fpng,"-vf",SCALE_VID,
                 "-c:v","libx264","-preset","veryfast","-crf","19","-r",str(FPS),"-an",cf])
        elif c["kind"] == "seg":
            run(["ffmpeg","-y","-ss",f"{c['s']:.3f}","-i",asset,"-t",f"{c['dur']:.3f}","-vf",SCALE_VID,
                 "-c:v","libx264","-preset","veryfast","-crf","19","-r",str(FPS),"-an",cf])
        else:  # image (append)
            run(["ffmpeg","-y","-loop","1","-t",f"{c['dur']:.3f}","-i",os.path.join(BASE, c['asset']),
                 "-vf",SCALE_IMG,"-c:v","libx264","-preset","veryfast","-crf","19","-r",str(FPS),"-an",cf])
        clip_files.append(cf)
    # 音声(絶対配置)
    buf = bytearray(int(round(total*RATE))*CH*SW)
    for gst, wp in audio_events:
        with wave.open(wp,"rb") as w: frames = w.readframes(w.getnframes())
        off = int(round(gst*RATE))*CH*SW
        if off+len(frames) > len(buf): frames = frames[:len(buf)-off]
        buf[off:off+len(frames)] = frames
    awp = os.path.join(WORK, f"sc{tag}_audio.wav")
    with wave.open(awp,"wb") as w:
        w.setnchannels(CH); w.setsampwidth(SW); w.setframerate(RATE); w.writeframes(bytes(buf))
    # オーバーレイ(字幕 + 矢印=ボブ付き)
    overlays = list(subs)
    for i, p in enumerate(pauses):
        if "arrow" in p:
            a = p["arrow"]; apng = os.path.join(WORK, f"sc{tag}_arrow{i}.png")
            render_arrow(apng, a["tx"], a["ty"], a.get("dir", "down"))
            ws = block_gstart[("p", i)]; we = ws + p["_dur"]
            pos = ("x='10*sin(2*PI*t*1.7)':y=0" if a.get("dir","down") in ("left","right")
                   else "x=0:y='10*sin(2*PI*t*1.7)'")
            overlays.append((apng, ws, we, pos))
    # 連結(concatフィルタでPTSを連続化) + overlay + 音声mux を一括
    inputs = []
    for cf in clip_files: inputs += ["-i", cf]
    nclip = len(clip_files)
    for ov in overlays: inputs += ["-i", ov[0]]
    inputs += ["-i", awp]
    audio_idx = nclip + len(overlays)
    fc = ["".join(f"[{i}:v]" for i in range(nclip)) + f"concat=n={nclip}:v=1:a=0[base]"]
    cur = "base"
    for k, (png, st, en, pos) in enumerate(overlays):
        idx = nclip + k; nxt = f"v{k}"
        fc.append(f"[{cur}][{idx}:v]overlay={pos}:enable='between(t,{st:.3f},{en:.3f})'[{nxt}]")
        cur = nxt
    out = os.path.join(SCN, f"scene_{tag}.mp4")
    cmd = ["ffmpeg","-y",*inputs,"-filter_complex",";".join(fc),"-map",f"[{cur}]",
           "-map",f"{audio_idx}:a","-t",f"{total:.3f}","-r",str(FPS),"-pix_fmt","yuv420p",
           "-c:v","libx264","-preset","veryfast","-crf","20","-c:a","aac","-b:a","192k",
           "-movflags","+faststart",out]
    run(cmd)
    segs = " ".join(f"[freeze@{p['at']:.0f}s+{p['_dur']:.1f}]" for p in pauses)
    print(f"  -> {out}  ({total:.2f}s)  pauses: {segs}")

def concat_all(freeze=0.5):
    files = sorted(f for f in os.listdir(SCN) if f.startswith("scene_") and f.endswith(".mp4"))
    if not files: print("結合対象なし"); return
    n = len(files)
    inp = []
    for f in files: inp += ["-i", os.path.join(SCN, f)]
    # 各シーン（最後以外）の末尾を最終フレームで freeze 秒静止させてから次へ
    fc = []
    pv, pa = [], []
    for i in range(n):
        if i < n - 1:
            fc.append(f"[{i}:v]tpad=stop_duration={freeze}:stop_mode=clone[pv{i}]")
            fc.append(f"[{i}:a]apad=pad_dur={freeze}[pa{i}]")
            pv.append(f"[pv{i}]"); pa.append(f"[pa{i}]")
        else:
            pv.append(f"[{i}:v]"); pa.append(f"[{i}:a]")
    concat_in = "".join(f"{v}{a}" for v, a in zip(pv, pa))
    fc.append(f"{concat_in}concat=n={n}:v=1:a=1[v][a]")
    final = os.path.join(OUT, "七福ライフハック_解説.mp4")
    run(["ffmpeg","-y",*inp,"-filter_complex",";".join(fc),"-map","[v]","-map","[a]",
         "-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p",
         "-c:a","aac","-b:a","192k","-movflags","+faststart",final])
    print(f"結合完了: {final}  {ffprobe_dur(final):.1f}s  ({n}シーン, freeze={freeze}s)")

if __name__ == "__main__":
    arg = sys.argv[1] if len(sys.argv) > 1 else "0"
    if arg == "concat":
        concat_all()
    else:
        n = int(arg)
        print(f"== シーン{n} ビルド ==")
        if "pauses" in SCENES[n]:
            build_scene_paused(n)
        else:
            build_scene(n)
