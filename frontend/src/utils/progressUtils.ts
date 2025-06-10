
export const simulateProgressiveExtraction = (
  callback: (progress: number) => void,
  finalCallback: () => void
) => {
  let progress = 0;
  const interval = setInterval(() => {
    progress += 5;
    callback(progress);
    if (progress >= 100) {
      clearInterval(interval);
      finalCallback();
    }
  }, 100);
};
