export function fileSizeHumanReadable(fileSize: number) {
  if (fileSize < 1024) {
    return fileSize + 'B';
  } else if (fileSize < 1024*1024) {
    return Math.round(fileSize/1024) + 'KB';
  } else {
    return Math.round(fileSize/1024/1024) + 'MB';
  }
}

export function toPlural (singular) {
  switch (singular) {
    case 'bacterium':
      return 'bacteria';
    default:
      return singular+'s';
  }
}