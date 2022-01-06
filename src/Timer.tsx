import {
  createEffect,
  createSignal,
  For,
  Show,
  Switch,
  Match,
  Accessor,
  createMemo,
} from "solid-js";
import { createStore } from "solid-js/store";

import sound from "./assets/success_bell-6776.mp3";

const tf = Intl.DateTimeFormat("en-US", {
  timeStyle: "medium",
});

const formatDifference = (msLeft: number): string => {
  const minutes = Math.floor(msLeft / 1000 / 60);
  const seconds = Math.floor((msLeft / 1000) % 60);
  return `${
    minutes > 0 ? `${minutes} minute${minutes > 1 ? "s" : ""} and` : ""
  } ${seconds} seconds`;
};
const formatDifferenceParts = (msLeft: number): [number, number] => {
  const minutes = Math.floor(msLeft / 1000 / 60);
  const seconds = Math.floor((msLeft / 1000) % 60);
  return [minutes, seconds];
};

const getTarget = (incr: number) => {
  const dt = new Date();

  dt.setTime(dt.getTime() + incr);
  return dt.getTime();
};
/* 
const adjustTarget = (pausedSince: number, target: number): number => 
 */
interface StateI {
  workN: number;
  breakN: number;
  target: number;
  state: "break" | "work";
  activePause: null | number;
  pauses: [number, number][];
  paused: boolean;
}

const getResetState = (workN: number, breakN: number): StateI => ({
  workN,
  breakN,
  target: getTarget(workN),
  state: "work",
  activePause: null,
  pauses: [],
  get paused() {
    return this.activePause != null;
  },
});

const getRatio = (totalMs: number, msLeft: number) => {
  return msLeft / totalMs;
};

const Timer = ({ workN, breakN }: { workN: number; breakN: number }) => {
  const [state, setState] = createStore<StateI>(getResetState(workN, breakN));

  const pause = () =>
    setState((state) => {
      if (!state.activePause) {
        return {
          activePause: new Date().getTime(),
          pauses: state.pauses,
        };
      }
      return state;
    });
  const resume = () =>
    setState(({ activePause, pauses, target: target }) => {
      if (activePause) {
        const now = new Date();
        const waitedFor = now.getTime() - activePause;

        return {
          target: new Date(target + waitedFor).getTime(),
          activePause: null,
          pauses: [[activePause, new Date().getTime()], ...pauses],
        };
      }
    });

  const playSound = () => {
    const audio = new Audio(sound);
    audio.play();
  }

  const startBreak = () => {
    playSound();
    setState((state) => ({
      state: "break",
      target: getTarget(state.breakN),
    }));
  };
  const startWork = () => {
    playSound();
    setState((state) => ({
      state: "work",
      target: getTarget(state.breakN),
    }));
  };

  const [guageState, setGuageState] = createSignal<GaugeConfig>({
    timeParts: formatDifferenceParts(0),
    ratio: 0,
    state: state.state,
  });


  const updateState = () => { // Update State and timing while in background. Update rendering once on switch to prevent unsightly flash.
    if (!state.paused) {
      if (state.state === "work" || state.state === "break") {
        const current = new Date().getTime();
        const msLeft = state.target - current;
        if (msLeft <= 0) {
          if (state.state === "break") {
            startWork();
          } else if (state.state === "work") {
            startBreak();
          }
          updateGaugeState(msLeft, state, setGuageState);
        }
      }
    }
    setTimeout(updateState, 33);
  };
  updateState();


  let animationFrame: number = 0;
  const updateAnimation = () => { // Update Animation on each frame which is actually rendered
    if (!state.paused) {
      if (state.state === "work" || state.state === "break") {
        const current = new Date().getTime();
        const msLeft = state.target - current;
        if (msLeft > 0) {
          updateGaugeState(msLeft, state, setGuageState); 
        }
      }
    }

    animationFrame = window.requestAnimationFrame(updateAnimation);
  };
  animationFrame = window.requestAnimationFrame(updateAnimation);

  createEffect(() => { // Stop animating  while hidden, restart when coming back.
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") {
        updateAnimation();
      } else {
        if (animationFrame) {
          window.cancelAnimationFrame(animationFrame);
        }
      }
    });
  });

  return (
    <>
      <Switch fallback={<div>What</div>}>
        <Match when={state.state === "work"}>
          <h1>Work. 💻️</h1>
        </Match>
        <Match when={state.state === "break"}>
          <h1>Take a Break. 🎉</h1>
        </Match>
      </Switch>
      <>
        <Gauge config={guageState}></Gauge>
        <br />
        <p>
          {state.state === "work" ? "Working" : "Break"} until{" "}
          {tf.format(state.target)}
        </p>
        <br />
        <button
          class={state.paused ? "pos" : "neg"}
          onClick={() => {
            if (state.paused) {
              resume();
            } else {
              pause();
            }
          }}
        >
          {state.paused ? "Resume" : "Pause"}
        </button>
        <Show when={state.pauses}>
          {(pauses) => <Pauses pauses={pauses}></Pauses>}
        </Show>
      </>
    </>
  );
};

interface GaugeConfig {
  timeParts: [number, number];
  ratio: number;
  state: "work" | "break";
}

function updateGaugeState(msLeft: number, state: StateI, setGuageState: <U extends GaugeConfig>(v: (U extends Function ? never : U) | ((prev: GaugeConfig) => U)) => U) {
  const newParts = formatDifferenceParts(msLeft < 0 ? 0 : msLeft);
  const newRatio = getRatio(
    state.state === "work" ? state.workN : state.breakN,
    msLeft
  );

  setGuageState({
    ratio: newRatio,
    timeParts: newParts,
    state: state.state,
  });
}

function Gauge({ config }: { config: Accessor<GaugeConfig> }) {
  const gradient = createMemo(() => {
    const { ratio, state } = config();
    if (state === "work") {
      const r = 1 - ratio;
      const percentage1 = `${r * 100}%`;
      const percentage2 = `${r * 100 + 0.1}%`;
      return `conic-gradient(
        transparent ${percentage1}, var(--pink) ${percentage2}
    )`;
    } else if (state === "break") {
      const r = ratio;
      const percentage1 = `${r * 100}%`;
      const percentage2 = `${r * 100 + 0.1}%`;
      return `conic-gradient(
        transparent ${percentage1}, var(--blue) ${percentage2}
    )`;
    }
  });

  const plural = (count: number, stem: string, suffix = "s") =>
    `${stem}${count === 1 ? "" : suffix}`;

  const timeParts = createMemo(() => config().timeParts);

  return (
    <div
      class="gauge"
      style={{
        "background-image": gradient(),
      }}
    >
      <div class="center">
        <span>
          {timeParts()[0]} {plural(timeParts()[0], "Minute")} <br />
          {timeParts()[1]} {plural(timeParts()[1], "Second")}
        </span>
      </div>
    </div>
  );
}

function Pauses({ pauses }: { pauses: [number, number][] }) {
  return (
    <ul>
      <For each={pauses}>
        {([start, end]) => (
          <li>
            {tf.format(start)} - {tf.format(end)} (
            {formatDifference(end - start)})
          </li>
        )}
      </For>
    </ul>
  );
}

export default Timer;
