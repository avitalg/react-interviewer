import type { Exercise } from "../types";
import type { TestApi } from "@/sandbox/types";

export const effectsExercises: Exercise[] = [
  {
    id: "effects-document-title",
    topic: "effects",
    title: "Sync the document title",
    difficulty: "Easy",
    solutionExplanation: `Keep the click count in state, then sync \`document.title\` in a \`useEffect\` whose dependency array is \`[count]\`. Without that array the effect would run after every render, including ones that didn't change the count.`,
    description: `Keep the browser tab's title in sync with a click counter. Updating \`document.title\` is a side effect, so it belongs in \`useEffect\`.

The starter code works, but its effect runs after **every** render. Make it run only when it needs to.`,
    requirements: [
      { id: "counter", text: "A **Click me** button increments a counter." },
      { id: "title", text: "`document.title` is `You clicked N times` and stays in sync with the counter (including on first render)." },
      { id: "deps", text: "Update the title in a `useEffect` with a dependency array, so it only re-runs when the count changes." },
    ],
    starterCode: `import { useEffect, useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = 'You clicked ' + count + ' times';
  });

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  );
}
`,
    referenceSolution: `import { useEffect, useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = 'You clicked ' + count + ' times';
  }, [count]);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  );
}
`,
    checks: [
      {
        id: "counter",
        requirementId: "counter",
        label: "Click me increments the counter",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const button = t.screen.getByRole("button", { name: "Click me" });
          await t.click(button);
          await t.click(button);
          t.assert(t.screen.queryByText(/clicked 2 times/), 'After two clicks the page should say "You clicked 2 times".');
        },
      },
      {
        id: "title",
        requirementId: "title",
        label: "document.title follows the count",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.expect(t.document.title, "Title on first render").toBe("You clicked 0 times");
          const button = t.screen.getByRole("button", { name: "Click me" });
          await t.click(button);
          await t.click(button);
          await t.click(button);
          t.expect(t.document.title, "Title after 3 clicks").toBe("You clicked 3 times");
        },
      },
      { id: "effect", requirementId: "deps", label: "Uses useEffect", kind: "static", rule: { rule: "usesHook", hook: "useEffect" } },
      { id: "deps", requirementId: "deps", label: "The effect has a dependency array", kind: "static", rule: { rule: "effectHasDepsArray" } },
    ],
  },
  {
    id: "effects-countdown",
    topic: "effects",
    title: "Countdown timer",
    difficulty: "Medium",
    solutionExplanation: `Put the interval in an effect that depends on whether the timer is running, and clear it in the cleanup so pausing or unmounting doesn't leave a ticker behind. Guard the tick so the count never goes below 0.`,

    description: `Build a 10-second countdown. The starter code starts a \`setInterval\` from the click handler and runs into the classic **stale closure** bug: the timer always sees \`seconds = 10\`, so it gets stuck on 9. It also never stops the interval.

Move the timer into an effect that starts when the countdown is running and cleans up after itself.`,
    requirements: [
      { id: "display", text: "Show the remaining seconds (starting at `10`) in `data-testid=\"seconds\"`." },
      { id: "tick", text: "**Start** counts down by 1 every second." },
      { id: "pause", text: "**Pause** stops the countdown, and **Start** resumes it from where it stopped." },
      { id: "done", text: "At 0 the countdown stops (never goes negative) and shows `Time's up!`." },
      { id: "cleanup", text: "Run the interval in a `useEffect` that clears it in its cleanup, so no timer keeps running after pausing or unmounting." },
    ],
    starterCode: `import { useState } from 'react';

export default function App() {
  const [seconds, setSeconds] = useState(10);

  function start() {
    setInterval(() => {
      setSeconds(seconds - 1);
    }, 1000);
  }

  return (
    <div>
      <p data-testid="seconds">{seconds}</p>
      <button onClick={start}>Start</button>
      <button>Pause</button>
    </div>
  );
}
`,
    referenceSolution: `import { useEffect, useState } from 'react';

export default function App() {
  const [seconds, setSeconds] = useState(10);
  const [running, setRunning] = useState(false);
  const done = seconds === 0;

  useEffect(() => {
    if (!running || done) return;
    const id = setInterval(() => {
      setSeconds((s) => s - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [running, done]);

  return (
    <div>
      <p data-testid="seconds">{seconds}</p>
      {done && <p>Time's up!</p>}
      <button onClick={() => setRunning(true)} disabled={done}>Start</button>
      <button onClick={() => setRunning(false)}>Pause</button>
    </div>
  );
}
`,
    checks: [
      {
        id: "display",
        requirementId: "display",
        label: "Starts at 10",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.expect(t.screen.getByTestId("seconds").textContent?.trim(), "Initial seconds").toBe("10");
        },
      },
      {
        id: "tick",
        requirementId: "tick",
        label: "Counts down once per second",
        kind: "runtime",
        async run(t: TestApi) {
          t.useFakeTimers();
          await t.render();
          await t.click(t.screen.getByRole("button", { name: "Start" }));
          await t.advanceTimers(1000);
          t.expect(t.screen.getByTestId("seconds").textContent?.trim(), "After 1 second").toBe("9");
          await t.advanceTimers(2000);
          t.expect(t.screen.getByTestId("seconds").textContent?.trim(), "After 3 seconds").toBe("7");
        },
      },
      {
        id: "pause",
        requirementId: "pause",
        label: "Pause stops it and Start resumes",
        kind: "runtime",
        async run(t: TestApi) {
          t.useFakeTimers();
          await t.render();
          await t.click(t.screen.getByRole("button", { name: "Start" }));
          await t.advanceTimers(2000);
          await t.click(t.screen.getByRole("button", { name: "Pause" }));
          await t.advanceTimers(3000);
          t.expect(t.screen.getByTestId("seconds").textContent?.trim(), "While paused").toBe("8");
          await t.click(t.screen.getByRole("button", { name: "Start" }));
          await t.advanceTimers(1000);
          t.expect(t.screen.getByTestId("seconds").textContent?.trim(), "After resuming for 1 second").toBe("7");
        },
      },
      {
        id: "done",
        requirementId: "done",
        label: "Stops at 0 and shows \"Time's up!\"",
        kind: "runtime",
        async run(t: TestApi) {
          t.useFakeTimers();
          await t.render();
          t.assert(!t.screen.queryByText("Time's up!"), "\"Time's up!\" should not show before the countdown ends.");
          await t.click(t.screen.getByRole("button", { name: "Start" }));
          await t.advanceTimers(10_000);
          t.expect(t.screen.getByTestId("seconds").textContent?.trim(), "After 10 seconds").toBe("0");
          t.assert(t.screen.queryByText("Time's up!"), "Show \"Time's up!\" when the countdown reaches 0.");
          await t.advanceTimers(3000);
          t.expect(t.screen.getByTestId("seconds").textContent?.trim(), "3 seconds after reaching 0").toBe("0");
        },
      },
      {
        id: "cleanup",
        requirementId: "cleanup",
        label: "No interval keeps running after pause, finish or unmount",
        kind: "runtime",
        async run(t: TestApi) {
          t.useFakeTimers();
          await t.render();
          await t.click(t.screen.getByRole("button", { name: "Start" }));
          await t.advanceTimers(1000);
          await t.click(t.screen.getByRole("button", { name: "Pause" }));
          t.expect(t.pendingTimers(), "Timers still scheduled after Pause").toBe(0);
          await t.click(t.screen.getByRole("button", { name: "Start" }));
          await t.advanceTimers(1000);
          await t.unmount();
          t.expect(t.pendingTimers(), "Timers still scheduled after unmounting").toBe(0);
        },
      },
      { id: "effect", requirementId: "cleanup", label: "Uses useEffect", kind: "static", rule: { rule: "usesHook", hook: "useEffect" } },
      { id: "has-cleanup", requirementId: "cleanup", label: "The timer effect returns a cleanup", kind: "static", rule: { rule: "effectHasCleanup" } },
    ],
  },
  {
    id: "effects-stopwatch",
    topic: "effects",
    title: "Stopwatch with laps",
    difficulty: "Hard",
    solutionExplanation: `Drive the clock from an interval in an effect that starts and stops with \`running\`, and always clear it in cleanup. Lap times are a list you prepend to; Reset stops the clock and empties both elapsed time and laps.`,

    description: `Build a stopwatch that shows elapsed time with one decimal (\`0.0\`, \`1.5\`, …) and can record laps.

Interval timers are fine for this exercise: tick every 100ms.`,
    requirements: [
      { id: "display", text: "Show the elapsed seconds with one decimal in `data-testid=\"time\"`, starting at `0.0`." },
      { id: "start-stop", text: "One button toggles between **Start** and **Stop**. Stopping keeps the elapsed time, and starting again continues from it." },
      { id: "reset", text: "**Reset** stops the stopwatch and sets the time back to `0.0`." },
      { id: "laps", text: "**Lap** adds the current time to a list (`<li>` per lap) with the newest lap first. Reset clears the laps." },
      { id: "cleanup", text: "The interval lives in a `useEffect` with cleanup, so nothing keeps ticking after Stop or unmount." },
    ],
    starterCode: `import { useState } from 'react';

export default function App() {
  const [elapsed, setElapsed] = useState(0);

  function start() {
    setInterval(() => setElapsed((ms) => ms + 100), 100);
  }

  // TODO: Stop, Reset and Lap
  return (
    <div>
      <p data-testid="time">{(elapsed / 1000).toFixed(1)}</p>
      <button onClick={start}>Start</button>
    </div>
  );
}
`,
    referenceSolution: `import { useEffect, useState } from 'react';

export default function App() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState([]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((ms) => ms + 100), 100);
    return () => clearInterval(id);
  }, [running]);

  function reset() {
    setRunning(false);
    setElapsed(0);
    setLaps([]);
  }

  return (
    <div>
      <p data-testid="time">{(elapsed / 1000).toFixed(1)}</p>
      <button onClick={() => setRunning(!running)}>{running ? 'Stop' : 'Start'}</button>
      <button onClick={() => setLaps([{ id: laps.length + 1, ms: elapsed }, ...laps])}>Lap</button>
      <button onClick={reset}>Reset</button>
      <ol>
        {laps.map((lap) => (
          <li key={lap.id}>Lap {lap.id}: {(lap.ms / 1000).toFixed(1)}s</li>
        ))}
      </ol>
    </div>
  );
}
`,
    checks: [
      {
        id: "display",
        requirementId: "display",
        label: "Starts at 0.0 and counts in tenths",
        kind: "runtime",
        async run(t: TestApi) {
          t.useFakeTimers();
          await t.render();
          t.expect(t.screen.getByTestId("time").textContent?.trim(), "Initial time").toBe("0.0");
          await t.click(t.screen.getByRole("button", { name: "Start" }));
          await t.advanceTimers(1500);
          t.expect(t.screen.getByTestId("time").textContent?.trim(), "After 1.5 seconds").toBe("1.5");
        },
      },
      {
        id: "start-stop",
        requirementId: "start-stop",
        label: "Start/Stop toggles and keeps the elapsed time",
        kind: "runtime",
        async run(t: TestApi) {
          t.useFakeTimers();
          await t.render();
          await t.click(t.screen.getByRole("button", { name: "Start" }));
          await t.advanceTimers(1000);
          const stop = t.screen.queryByRole("button", { name: "Stop" });
          t.assert(stop, 'While running, the Start button should read "Stop".');
          await t.click(stop);
          await t.advanceTimers(1000);
          t.expect(t.screen.getByTestId("time").textContent?.trim(), "Time after stopping").toBe("1.0");
          await t.click(t.screen.getByRole("button", { name: "Start" }));
          await t.advanceTimers(500);
          t.expect(t.screen.getByTestId("time").textContent?.trim(), "Time after resuming").toBe("1.5");
        },
      },
      {
        id: "reset",
        requirementId: "reset",
        label: "Reset stops and zeroes the time",
        kind: "runtime",
        async run(t: TestApi) {
          t.useFakeTimers();
          await t.render();
          await t.click(t.screen.getByRole("button", { name: "Start" }));
          await t.advanceTimers(2000);
          await t.click(t.screen.getByRole("button", { name: "Reset" }));
          t.expect(t.screen.getByTestId("time").textContent?.trim(), "Time after Reset").toBe("0.0");
          await t.advanceTimers(1000);
          t.expect(t.screen.getByTestId("time").textContent?.trim(), "Reset should also stop the stopwatch").toBe("0.0");
        },
      },
      {
        id: "laps",
        requirementId: "laps",
        label: "Lap records times, newest first",
        kind: "runtime",
        async run(t: TestApi) {
          t.useFakeTimers();
          await t.render();
          await t.click(t.screen.getByRole("button", { name: "Start" }));
          await t.advanceTimers(1000);
          await t.click(t.screen.getByRole("button", { name: "Lap" }));
          await t.advanceTimers(1500);
          await t.click(t.screen.getByRole("button", { name: "Lap" }));
          const laps = t.screen.$$("li").map((li) => li.textContent ?? "");
          t.expect(laps.length, "Number of laps").toBe(2);
          t.assert(laps[0].includes("2.5") && laps[1].includes("1.0"), `Expected laps 2.5 then 1.0 (newest first), got ${JSON.stringify(laps)}.`);
          await t.click(t.screen.getByRole("button", { name: "Reset" }));
          t.expect(t.screen.$$("li").length, "Laps after Reset").toBe(0);
        },
      },
      {
        id: "cleanup",
        requirementId: "cleanup",
        label: "No interval survives Stop or unmount",
        kind: "runtime",
        async run(t: TestApi) {
          t.useFakeTimers();
          await t.render();
          await t.click(t.screen.getByRole("button", { name: "Start" }));
          await t.advanceTimers(300);
          const stop = t.screen.queryByRole("button", { name: "Stop" });
          t.assert(stop, 'While running, the Start button should read "Stop".');
          await t.click(stop);
          t.expect(t.pendingTimers(), "Timers still scheduled after Stop").toBe(0);
          await t.click(t.screen.getByRole("button", { name: "Start" }));
          await t.unmount();
          t.expect(t.pendingTimers(), "Timers still scheduled after unmounting").toBe(0);
        },
      },
      { id: "has-cleanup", requirementId: "cleanup", label: "The timer effect returns a cleanup", kind: "static", rule: { rule: "effectHasCleanup" } },
    ],
  },
];
