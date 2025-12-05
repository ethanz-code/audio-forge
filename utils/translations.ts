import { Language } from '../types';

export const translations = {
  en: {
    appTitle: "AudioForge",
    footerText: "Process audio locally in your browser.",
    splitter: {
      nav: "Splitter",
      title: "Smart Splitter",
      description: "Upload an audio file to automatically detect silence and split it into multiple distinct clips.",
      uploadTitle: "Click to upload",
      uploadDrag: "or drag",
      uploadHint: "MP3, WAV (Max 50MB)",
      loading: "Loading...",
      threshold: "Threshold (dB)",
      minSilence: "Min Silence (s)",
      processBtn: "Process Audio",
      foundSegments: "Found {count} segments",
      part: "Part",
      downloadAll: "Download All (ZIP)"
    },
    assembler: {
      nav: "Assembler",
      title: "Timeline Assembler",
      description: "Sequence multiple clips. Drag to move; tracks automatically push subsequent ones if they overlap.",
      addTrack: "Add Track",
      addFiles: "Files",
      addFolder: "Folder",
      uploadHint: "Drag ingredients (audio files) here to start baking!",
      exportMix: "Export Mix",
      duration: "Duration",
      startTime: "Start Time (s)",
      synced: "Synced",
      noTracks: "No tracks yet. Add audio files to start assembling.",
      errorOverlap: "Cannot move \"{track}\" to {time}s. Overlaps with \"{overlap}\".",
      errorLoad: "Failed to load audio",
      errorExport: "Please resolve timeline conflicts before exporting.",
      exportSuccess: "mixed_audio"
    }
  },
  zh: {
    appTitle: "音频工坊",
    footerText: "在浏览器本地处理您的音频文件。",
    splitter: {
      nav: "分割器",
      title: "智能音频分割",
      description: "上传音频文件，自动检测静音部分并将其拆分为多个独立的片段。",
      uploadTitle: "点击上传",
      uploadDrag: "或拖拽文件",
      uploadHint: "MP3, WAV (最大 50MB)",
      loading: "加载中...",
      threshold: "阈值 (dB)",
      minSilence: "最小静音时长 (s)",
      processBtn: "处理音频",
      foundSegments: "共发现 {count} 个片段",
      part: "片段",
      downloadAll: "批量下载 (ZIP)"
    },
    assembler: {
      nav: "组装器",
      title: "时间轴组装",
      description: "排列多个音频片段。拖动调整位置，若发生重叠会自动向后推移后续片段。",
      addTrack: "添加轨道",
      addFiles: "选择文件",
      addFolder: "选择文件夹",
      uploadHint: "将“食材”（音频文件）拖到此处开始烘焙！",
      exportMix: "导出合成",
      duration: "时长",
      startTime: "开始时间 (s)",
      synced: "已同步",
      noTracks: "暂无轨道。请添加音频文件开始组装。",
      errorOverlap: "无法将 \"{track}\" 移动到 {time}s。与 \"{overlap}\" 重叠。",
      errorLoad: "加载音频失败",
      errorExport: "导出前请先解决时间轴冲突。",
      exportSuccess: "合成音频"
    }
  },
  ja: {
    appTitle: "AudioForge",
    footerText: "ブラウザで音声をローカルに処理します。",
    splitter: {
      nav: "分割ツール",
      title: "スマート分割",
      description: "音声ファイルをアップロードして無音を自動検出し、複数のクリップに分割します。",
      uploadTitle: "アップロード",
      uploadDrag: "またはドラッグ",
      uploadHint: "MP3, WAV (最大 50MB)",
      loading: "読み込み中...",
      threshold: "しきい値 (dB)",
      minSilence: "最小無音期間 (s)",
      processBtn: "音声を処理",
      foundSegments: "{count} 個のセグメントが見つかりました",
      part: "パート",
      downloadAll: "一括ダウンロード (ZIP)"
    },
    assembler: {
      nav: "アセンブラ",
      title: "タイムライン編集",
      description: "複数のクリップを配置します。ドラッグして移動し、重なる場合は後ろのクリップが自動的に押し出されます。",
      addTrack: "トラック追加",
      addFiles: "ファイル",
      addFolder: "フォルダ",
      uploadHint: "ここに「材料」（音声ファイル）をドラッグして、焼き始めましょう！",
      exportMix: "書き出し",
      duration: "長さ",
      startTime: "開始時間 (s)",
      synced: "同期済み",
      noTracks: "トラックがありません。音声ファイルを追加してください。",
      errorOverlap: "\"{track}\" を {time}秒 に移動できません。 \"{overlap}\" と重なっています。",
      errorLoad: "音声の読み込みに失敗しました",
      errorExport: "書き出す前にタイムラインの競合を解決してください。",
      exportSuccess: "ミックス音声"
    }
  }
};