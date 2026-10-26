# One Resolve menu script.
# Save as:
# C:\ProgramData\Blackmagic Design\DaVinci Resolve\Fusion\Scripts\Utility\Weekly Stringout.py
# Then restart Resolve and choose Workspace > Scripts > Weekly Stringout.

import json
import math
import os
import re
import subprocess
import sys
from urllib.parse import unquote, urlparse

ROOT = r"C:\DaVinciResolveScripts"
KEY_PATH = os.path.join(ROOT, "sheets-key.json")
CONFIG_PATH = os.path.join(ROOT, "config.json")
LOG_PATH = os.path.join(ROOT, "last-run.txt")
PY_LAUNCHER = r"C:\Windows\py.exe"
MARKER_TAG = "avid-weekly"
SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]

COL_USE = 0
COL_LINK = 1
COL_DURATION = 12
COL_SCRIPT = 17
CONTINUATION = "use with script above"


def script_path():
    if "__file__" in globals():
        return os.path.abspath(__file__)
    return r"C:\ProgramData\Blackmagic Design\DaVinci Resolve\Fusion\Scripts\Utility\Weekly Stringout.py"


def write_log(message):
    print(message)
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as handle:
            handle.write(message + "\n")
    except OSError:
        pass


def parse_duration(text):
    raw = (text or "").strip().lower()
    if raw.endswith("sec"):
        raw = raw[:-3].strip()
    if raw.endswith("s") and ":" not in raw:
        raw = raw[:-1].strip()
    if not raw:
        return None
    parts = raw.split(":")
    if len(parts) > 3:
        return None
    try:
        numbers = [float(part) for part in parts]
    except ValueError:
        return None
    seconds = 0.0
    for number in numbers:
        seconds = seconds * 60 + number
    return seconds


def parse_fps(value):
    return float(str(value or "").replace("DF", "").strip())


def is_continuation(text):
    cleaned = re.sub(r"\s+", " ", (text or "").strip().strip("*").strip())
    return cleaned.casefold() == CONTINUATION


def basename_from_url(url):
    base = os.path.basename(unquote(urlparse(url).path).strip("/"))
    if base.casefold() in {"view", "edit", "preview", "watch"} or "." not in base:
        return ""
    return base


def filename_from(url, display):
    from_url = basename_from_url(url) if url else ""
    if from_url:
        return from_url
    display = (display or "").strip()
    if display.lower().startswith(("http://", "https://")):
        return basename_from_url(display)
    if not display:
        return ""
    base = os.path.basename(display.replace("\\", "/"))
    if url or "." in base:
        return base
    return ""


def cell_url(cell):
    if not cell:
        return ""
    if cell.get("hyperlink"):
        return cell["hyperlink"]
    for run in cell.get("textFormatRuns") or []:
        uri = ((run.get("format") or {}).get("link") or {}).get("uri")
        if uri:
            return uri
    for run in cell.get("chipRuns") or []:
        uri = ((run.get("chip") or {}).get("richLinkProperties") or {}).get("uri")
        if uri:
            return uri
    return ""


def column(row, index):
    return row[index] if index < len(row) else ""


def parse_sheet_rows(value_rows, links_by_index):
    parsed = []
    for index, value_row in enumerate(value_rows):
        if index == 0:
            continue
        value_row = value_row or []
        url, label = links_by_index.get(index, ("", ""))
        script = column(value_row, COL_SCRIPT).strip()
        parsed.append(
            {
                "row_number": index + 1,
                "use": column(value_row, COL_USE).strip().casefold() == "yes",
                "filename": filename_from(url, label or column(value_row, COL_LINK)),
                "duration": parse_duration(column(value_row, COL_DURATION)),
                "script": script,
                "scripted": bool(script) and not is_continuation(script),
            }
        )
    return parsed


def used_rows(rows):
    return [row for row in rows if row["use"] and row["filename"]]


def segments_from_rows(rows):
    starts = [index for index, row in enumerate(rows) if row["scripted"]]
    segments = []
    for position, start in enumerate(starts):
        end = starts[position + 1] if position + 1 < len(starts) else len(rows)
        chunk = rows[start:end]
        segments.append(
            {
                "script": chunk[0]["script"],
                "duration": chunk[0]["duration"],
                "sheet_row": chunk[0]["row_number"],
                "clips": [row for row in chunk if row["use"] and row["filename"]],
            }
        )
    return segments


def first_line(text, limit=80):
    raw = (text or "").strip()
    line = re.sub(r"\s+", " ", raw.splitlines()[0] if raw else "Segment")
    if len(line) > limit:
        return line[: limit - 1] + "…"
    return line


def build_marker_list(segments, fps, start_frame):
    markers = []
    warnings = []
    cursor = int(start_frame)
    occupied = set()

    def add(frame, color, name, note):
        frame = int(frame)
        if frame in occupied:
            return
        occupied.add(frame)
        markers.append({"frame": frame, "color": color, "name": name, "note": (note or "")[:4000]})

    for segment in segments:
        duration = segment["duration"]
        if duration is None:
            warnings.append("Row %s has a script and no duration in column S." % segment["sheet_row"])
            duration = 0
        frames = int(math.floor(max(duration, 0) * fps + 0.5))
        clips = segment["clips"]
        note = segment["script"]
        if clips:
            note = "%s\n\n%s" % (clips[0]["filename"], segment["script"])
        add(cursor, "Blue", "SEG | %s" % first_line(segment["script"]), note)
        count = len(clips)
        if frames > 0 and count > 1:
            for index in range(1, count):
                frame = cursor + ((index * frames + count // 2) // count)
                if cursor < frame < cursor + frames:
                    add(frame, "Red", "CLIP | %s" % clips[index]["filename"], "")
        elif count > 1:
            warnings.append("Row %s has %s used clips and a duration of 0." % (segment["sheet_row"], count))
        cursor += frames
    return markers, warnings


def quote_sheet(name):
    return "'" + name.replace("'", "''") + "'"


def extract_spreadsheet_id(text):
    text = (text or "").strip()
    match = re.search(r"/d/([a-zA-Z0-9-_]+)", text)
    if match:
        return match.group(1)
    return text


def load_spreadsheet_id():
    if not os.path.exists(CONFIG_PATH):
        return ""
    with open(CONFIG_PATH, encoding="utf-8") as handle:
        return (json.load(handle).get("spreadsheet_id") or "").strip()


def save_spreadsheet_id(text):
    spreadsheet_id = extract_spreadsheet_id(text)
    if not spreadsheet_id:
        raise RuntimeError("Paste the spreadsheet URL first.")
    os.makedirs(ROOT, exist_ok=True)
    with open(CONFIG_PATH, "w", encoding="utf-8") as handle:
        json.dump({"spreadsheet_id": spreadsheet_id}, handle, indent=2)
        handle.write("\n")
    return spreadsheet_id


def normalize_name(name):
    return unquote(os.path.basename((name or "").replace("\\", "/")).strip()).casefold()


def strip_sort_prefix(name):
    return re.sub(r"^\d{1,4}[_\-\s]+", "", name)


def decode_output(proc):
    stdout = proc.stdout.decode("utf-8", errors="replace") if isinstance(proc.stdout, bytes) else (proc.stdout or "")
    stderr = proc.stderr.decode("utf-8", errors="replace") if isinstance(proc.stderr, bytes) else (proc.stderr or "")
    start = stdout.find("{")
    if start < 0:
        detail = stderr.strip() or stdout.strip() or "The sheet request returned nothing."
        raise RuntimeError(detail)
    payload, _end = json.JSONDecoder().raw_decode(stdout[start:])
    if not payload.get("ok"):
        raise RuntimeError(payload.get("error") or "The sheet request failed.")
    return payload


def call_sheet(command, argument=""):
    if not os.path.exists(PY_LAUNCHER):
        raise RuntimeError("Install Python from python.org so this file exists:\n%s" % PY_LAUNCHER)
    env = os.environ.copy()
    env["WEEKLY_FETCH"] = "1"
    flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    proc = subprocess.run(
        [PY_LAUNCHER, "-3", script_path(), command, argument],
        capture_output=True,
        env=env,
        timeout=90,
        creationflags=flags,
    )
    return decode_output(proc)


def sheets_service():
    if not os.path.exists(KEY_PATH):
        raise RuntimeError("Missing key file: %s" % KEY_PATH)
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
    except ImportError as exc:
        raise RuntimeError(
            "Run this once in a command prompt:\n"
            "py -3 -m pip install google-auth google-api-python-client"
        ) from exc
    creds = service_account.Credentials.from_service_account_file(KEY_PATH, scopes=SCOPES)
    return build("sheets", "v4", credentials=creds, cache_discovery=False)


def fetch_tabs(service, spreadsheet_id):
    meta = service.spreadsheets().get(spreadsheetId=spreadsheet_id, fields="sheets.properties.title").execute()
    return [sheet["properties"]["title"] for sheet in meta.get("sheets", [])]


def fetch_rows(service, spreadsheet_id, tab):
    values = service.spreadsheets().values().get(
        spreadsheetId=spreadsheet_id,
        range="%s!G:X" % quote_sheet(tab),
        valueRenderOption="FORMATTED_VALUE",
    ).execute().get("values") or []
    grid = service.spreadsheets().get(
        spreadsheetId=spreadsheet_id,
        ranges=["%s!H:H" % quote_sheet(tab)],
        fields="sheets.data(startRow,rowData.values(formattedValue,hyperlink,textFormatRuns,chipRuns))",
    ).execute()
    data = ((grid.get("sheets") or [{}])[0].get("data") or [{}])[0]
    links = {}
    for offset, row in enumerate(data.get("rowData") or []):
        cells = (row or {}).get("values") or []
        cell = cells[0] if cells else {}
        links[data.get("startRow", 0) + offset] = (cell_url(cell), (cell or {}).get("formattedValue") or "")
    return parse_sheet_rows(values, links)


def fetch_main(argv):
    command = argv[1] if len(argv) > 1 else ""
    argument = argv[2] if len(argv) > 2 else ""
    try:
        service = sheets_service()
        spreadsheet_id = load_spreadsheet_id()
        if not spreadsheet_id:
            raise RuntimeError("Save the spreadsheet URL in the script window first.")
        if command == "tabs":
            payload = {"ok": True, "tabs": fetch_tabs(service, spreadsheet_id)}
        elif command == "rows":
            payload = {"ok": True, "rows": fetch_rows(service, spreadsheet_id, argument)}
        else:
            raise RuntimeError("Unknown sheet request.")
    except Exception as exc:
        payload = {"ok": False, "error": str(exc)}
    sys.stdout.write(json.dumps(payload))


def walk_pool(folder, found=None):
    found = [] if found is None else found
    for clip in folder.GetClipList() or []:
        found.append(clip)
    for sub in folder.GetSubFolderList() or []:
        walk_pool(sub, found)
    return found


def index_pool(clips):
    index = {}

    def add(name, clip):
        key = normalize_name(name)
        if not key:
            return
        index.setdefault(key, [])
        if clip not in index[key]:
            index[key].append(clip)
        stripped = strip_sort_prefix(key)
        if stripped and stripped != key:
            index.setdefault(stripped, [])
            if clip not in index[stripped]:
                index[stripped].append(clip)

    for clip in clips:
        props = clip.GetClipProperty() or {}
        if (props.get("Type") or "") == "Timeline":
            continue
        for key in ("File Name", "Clip Name"):
            add(props.get(key) or "", clip)
        add(os.path.basename(props.get("File Path") or ""), clip)
    return index


def match_clip(index, filename):
    key = normalize_name(filename)
    exact = index.get(key) or []
    if len(exact) == 1:
        return exact[0], ""
    if len(exact) > 1:
        return None, "more than one media pool clip is named %s" % filename
    stripped = index.get(strip_sort_prefix(key)) or []
    if len(stripped) == 1:
        return stripped[0], ""
    if len(stripped) > 1:
        return None, "more than one media pool clip matches %s" % filename
    return None, "not in the media pool"


def timeline_name(tab, project):
    cleaned = re.sub(r'[\\/:*?"<>|]+', " ", tab).strip() or "Stringout"
    existing = set()
    for index in range(1, (project.GetTimelineCount() or 0) + 1):
        timeline = project.GetTimelineByIndex(index)
        if timeline:
            existing.add(timeline.GetName())
    if cleaned not in existing:
        return cleaned
    number = 2
    while "%s %s" % (cleaned, number) in existing:
        number += 1
    return "%s %s" % (cleaned, number)


def clear_script_markers(timeline):
    frames = []
    for frame, info in (timeline.GetMarkers() or {}).items():
        info = info or {}
        name = info.get("name") or ""
        custom = info.get("customData") or ""
        if custom == MARKER_TAG or name.startswith("SEG |") or name.startswith("CLIP |"):
            frames.append(int(float(frame)))
    for frame in frames:
        timeline.DeleteMarkerAtFrame(frame)
    return len(frames)


def current_project(resolve):
    project = resolve.GetProjectManager().GetCurrentProject()
    if project is None:
        raise RuntimeError("Open a project first.")
    return project


def selected_rows(tab):
    if not tab:
        raise RuntimeError("Choose a sheet.")
    return call_sheet("rows", tab)["rows"]


def build_stringout(resolve, tab, rows):
    wanted = used_rows(rows)
    nameless = [row for row in rows if row["use"] and not row["filename"]]
    if not wanted:
        lines = ["No usable Yes rows in %s." % tab]
        if nameless:
            lines.append("Yes rows with no filename in column H:")
            lines.extend("Row %s" % row["row_number"] for row in nameless)
        return "\n".join(lines)

    project = current_project(resolve)
    pool = project.GetMediaPool()
    index = index_pool(walk_pool(pool.GetRootFolder()))
    ordered = []
    missing = []
    for row in wanted:
        clip, reason = match_clip(index, row["filename"])
        if clip is None:
            missing.append("Row %s: %s (%s)" % (row["row_number"], row["filename"], reason))
        else:
            ordered.append((clip, row))
    if not ordered:
        return "None of the Yes clips were found in the media pool.\n\n" + "\n".join(missing)

    name = timeline_name(tab, project)
    timeline = pool.CreateEmptyTimeline(name)
    if not timeline:
        raise RuntimeError("Resolve did not create a timeline named %s." % name)
    project.SetCurrentTimeline(timeline)
    failed = []
    for clip, row in ordered:
        if not pool.AppendToTimeline([clip]):
            failed.append("Row %s: %s" % (row["row_number"], row["filename"]))
    lines = ["Timeline: %s" % name, "Placed %s clips from %s." % (len(ordered) - len(failed), tab)]
    if nameless:
        lines.extend(["", "Marked Yes, but column H had no filename:"])
        lines.extend("Row %s" % row["row_number"] for row in nameless)
    if missing:
        lines.extend(["", "Marked Yes, not placed:"])
        lines.extend(missing)
    if failed:
        lines.extend(["", "Found in the pool, but Resolve did not append them:"])
        lines.extend(failed)
    return "\n".join(lines)


def add_markers(resolve, tab, rows):
    segments = segments_from_rows(rows)
    if not segments:
        return "No script text was found in column X of %s." % tab
    project = current_project(resolve)
    timeline = project.GetCurrentTimeline()
    if timeline is None:
        raise RuntimeError("Open the stringout timeline, then click Add markers.")
    fps = parse_fps(timeline.GetSetting("timelineFrameRate"))
    markers, warnings = build_marker_list(segments, fps, timeline.GetStartFrame())
    removed = clear_script_markers(timeline)
    failed = []
    for marker in markers:
        if not timeline.AddMarker(marker["frame"], marker["color"], marker["name"], marker["note"], 1, MARKER_TAG):
            failed.append("%s at frame %s" % (marker["name"], marker["frame"]))
    blues = sum(1 for marker in markers if marker["color"] == "Blue")
    reds = sum(1 for marker in markers if marker["color"] == "Red")
    lines = [
        "Timeline: %s" % timeline.GetName(),
        "Sheet: %s" % tab,
        "Blue markers: %s" % blues,
        "Red markers: %s" % reds,
        "Replaced %s older script markers." % removed,
    ]
    if warnings:
        lines.append("")
        lines.extend(warnings)
    if failed:
        lines.extend(["", "Resolve did not add:"])
        lines.extend(failed)
    return "\n".join(lines)


def show_window(resolve):
    try:
        bmd_module = bmd
    except NameError:
        import DaVinciResolveScript as bmd_module
    fusion = resolve.Fusion()
    if fusion is None:
        fusion = bmd_module.scriptapp("Fusion")
    ui = fusion.UIManager
    disp = bmd_module.UIDispatcher(ui)
    win = disp.AddWindow(
        {"ID": "WeeklyWin", "WindowTitle": "Weekly Stringout", "Geometry": [240, 140, 520, 560]},
        [
            ui.VGroup(
                {"Spacing": 8},
                [
                    ui.Label({"Text": "Spreadsheet URL"}),
                    ui.LineEdit({"ID": "Url"}),
                    ui.Button({"ID": "SaveUrl", "Text": "Load sheets"}),
                    ui.Label({"Text": "Sheet"}),
                    ui.ComboBox({"ID": "Sheet"}),
                    ui.HGroup(
                        [
                            ui.Button({"ID": "Stringout", "Text": "Build stringout"}),
                            ui.Button({"ID": "Markers", "Text": "Add markers"}),
                        ]
                    ),
                    ui.TextEdit({"ID": "Status", "ReadOnly": True, "Text": "Paste the spreadsheet URL, then load the sheets."}),
                ],
            )
        ],
    )
    items = win.GetItems()

    def set_status(message):
        write_log(message)
        try:
            items["Status"].PlainText = message
        except Exception:
            items["Status"].Text = message

    def fill_sheets(ev=None):
        try:
            typed = items["Url"].Text
            if typed.strip():
                save_spreadsheet_id(typed)
            tabs = call_sheet("tabs").get("tabs") or []
            if not tabs:
                raise RuntimeError("The spreadsheet has no tabs.")
            try:
                items["Sheet"].Clear()
            except Exception:
                pass
            for name in tabs:
                items["Sheet"].AddItem(name)
            set_status("Loaded %s sheets. Choose one, then build the stringout." % len(tabs))
        except Exception as exc:
            set_status(str(exc))

    def run_action(action):
        try:
            tab = items["Sheet"].CurrentText
            rows = selected_rows(tab)
            if action == "stringout":
                set_status(build_stringout(resolve, tab, rows))
            else:
                set_status(add_markers(resolve, tab, rows))
        except Exception as exc:
            set_status(str(exc))

    win.On.WeeklyWin.Close = lambda ev: disp.ExitLoop()
    win.On.SaveUrl.Clicked = fill_sheets
    win.On.Stringout.Clicked = lambda ev: run_action("stringout")
    win.On.Markers.Clicked = lambda ev: run_action("markers")
    saved = load_spreadsheet_id()
    if saved:
        items["Url"].Text = saved
    win.Show()
    if saved:
        fill_sheets()
    disp.RunLoop()
    win.Hide()


def resolve_main():
    try:
        os.makedirs(ROOT, exist_ok=True)
        with open(LOG_PATH, "w", encoding="utf-8") as handle:
            handle.write("")
    except OSError:
        pass
    try:
        bmd_module = bmd
    except NameError:
        import DaVinciResolveScript as bmd_module
    resolve = bmd_module.scriptapp("Resolve")
    if resolve is None:
        raise RuntimeError("Open a project in Resolve, then run Weekly Stringout from Workspace > Scripts.")
    show_window(resolve)


if __name__ == "__main__":
    if os.environ.get("WEEKLY_FETCH") == "1":
        fetch_main(sys.argv)
    else:
        try:
            resolve_main()
        except Exception as exc:
            write_log(str(exc))
