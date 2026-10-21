const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

const tags = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'button', 'a', 'label', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'svg', 'path', 'nav', 'header', 'footer', 'main', 'section', 'form', 'select', 'option', 'textarea', 'ul', 'li', 'strong', 'em', 'b', 'i', 'u', 's', 'strike', 'sub', 'sup', 'code', 'pre', 'blockquote', 'img', 'input', 'hr', 'br', 'meta', 'link', 'head', 'body', 'html', 'title', 'style', 'script', 'noscript', 'iframe', 'object', 'embed', 'param', 'video', 'audio', 'source', 'track', 'canvas', 'map', 'area', 'math', 'mi', 'mo', 'mn', 'ms', 'mtext', 'mglyph', 'mspace', 'maction', 'menclose', 'merror', 'mfenced', 'mfrac', 'mroot', 'msqrt', 'msub', 'msup', 'msubsup', 'mmultiscripts', 'mover', 'munder', 'munderover', 'mtable', 'mtr', 'mtd', 'maligngroup', 'malignmark', 'mphantom', 'mstack', 'mlongdiv', 'msgroup', 'msrow', 'mscarries', 'mscarry', 'math', 'circle', 'rect', 'line', 'polyline', 'polygon', 'text', 'tspan', 'textPath', 'defs', 'clipPath', 'g', 'use', 'image', 'foreignObject', 'LinearGradient', 'RadialGradient', 'stop', 'pattern', 'marker', 'symbol', 'mask', 'filter', 'feDistantLight', 'fePointLight', 'feSpotLight', 'feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap', 'feDropShadow', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'feSpecularLighting', 'feTile', 'feTurbulence', 'animate', 'animateMotion', 'animateTransform', 'mpath', 'set', 'view', 'App', 'TeacherSection', 'ClassSetupSection', 'GradeTrackerSection', 'Search', 'Bell', 'LogOut', 'User', 'Settings', 'Menu', 'X', 'TrendingUp', 'QrCode', 'Printer', 'Mail', 'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight', 'MoreHorizontal', 'MoreVertical', 'Check', 'AlertCircle', 'AlertTriangle', 'Info', 'CheckCircle', 'XCircle', 'Plus', 'Minus', 'Edit', 'Trash', 'Save', 'FileText', 'File', 'Folder', 'FolderPlus', 'FolderMinus', 'FolderOpen', 'Image', 'Camera', 'Video', 'Mic', 'Volume', 'Volume1', 'Volume2', 'VolumeX', 'Play', 'Pause', 'Square', 'Circle', 'Triangle', 'Star', 'Heart', 'Clock', 'Calendar', 'Map', 'MapPin', 'Phone', 'Smartphone', 'Tablet', 'Monitor', 'Laptop', 'Watch', 'Tv', 'Radio', 'Speaker', 'Headphones', 'MicOff', 'VideoOff', 'CameraOff', 'Wifi', 'WifiOff', 'Bluetooth', 'Zap', 'ZapOff', 'Sun', 'Moon', 'Cloud', 'CloudRain', 'CloudSnow', 'CloudLightning', 'CloudDrizzle', 'Umbrella', 'Wind', 'Thermometer', 'Droplet', 'Flame', 'Activity', 'Award', 'Badge', 'Briefcase', 'Coffee', 'Gift', 'Globe', 'Lock', 'Unlock', 'Key', 'Shield', 'ShieldOff', 'Target', 'Crosshair', 'Flag', 'MapPin', 'Navigation', 'Compass', 'Eye', 'EyeOff', 'ZoomIn', 'ZoomOut', 'Search', 'Hash', 'AtSign', 'Link', 'Link2', 'Paperclip', 'Scissors', 'Copy', 'Paste', 'Trash2', 'Archive', 'Inbox', 'Send', 'Share', 'Share2', 'Reply', 'Forward', 'Repeat', 'RefreshCcw', 'RefreshCw', 'RotateCcw', 'RotateCw', 'Shuffle', 'Filter', 'List', 'Grid', 'Layout', 'Sidebar', 'Maximize', 'Minimize', 'Maximize2', 'Minimize2', 'Expand', 'Shrink', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUpLeft', 'ArrowUpRight', 'ArrowDownLeft', 'ArrowDownRight', 'ArrowUpCircle', 'ArrowDownCircle', 'ArrowLeftCircle', 'ArrowRightCircle', 'Home', 'Markdown', 'ReactMarkdown'];

let changed = 0;
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  // If line ends with </tagname
  for (let tag of tags) {
    if (line.endsWith('</' + tag)) {
      lines[i] = line + '>';
      changed++;
      break;
    }
  }
}
fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Fixed ' + changed + ' closing tags.');
