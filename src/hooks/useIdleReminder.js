import { useEffect } from "react";

export default function useIdleReminder(active, interval = 60000) {
  useEffect(() => {
    if (!active || !("navigator" in window && "background" in navigator)) return;

    let taskId;

    const runTask = async () => {
      taskId = await navigator.background.requestPeriodicSync("idle-reminder", {
        minInterval: interval,
      });

      console.log("⏰ Idle reminder task registered:", taskId);
    };

    runTask();

    return () => {
      navigator.background.unregister(taskId);
    };
  }, [active, interval]);
}