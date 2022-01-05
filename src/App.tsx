import {
  Component,
  createSignal,
  Show,
  batch,
} from "solid-js";

import.meta.env

import Timer from "./Timer";


const presets: [number,number][] = [
  [15, 5],
  [25, 5],
  [50, 10],

];
if (import.meta.env.DEV) {
  presets.push([0.1,0.1]);
}
const App: Component = () => {
  const [showTimer, setShowTimer] = createSignal(false);
  const [workMinutes, setWork] = createSignal<number>(25);
  const [breakMinutes, setBreak] = createSignal<number>(5);

  const loadPreset = ([work, brk]: [number, number]) => {
    batch(() => {
      setWork(work);
      setBreak(brk);
      setShowTimer(true);
    })
  };


  return (
    <main>
      <Show when={showTimer()}>
        <Timer workN={workMinutes() * 60 * 1000} breakN={breakMinutes() * 60 * 1000}></Timer>
      </Show>
      <Show when={!showTimer()}>
        <>
          <h1>Shall we start?</h1>

          <div className="presets">
            {presets.map((prst) => <button class="preset" onClick={() => loadPreset(prst)}>{prst[0]} + {prst[1]}</button>)}
          </div>


          <h2>... or Custom:</h2>
          <div className="form-group">
            <label for="work">Work (minutes):</label>
            <input
              id="work"
              type="number"
              name="work"
              value={workMinutes()}
              min={1}
              onChange={(event) => {
                setWork(+event.currentTarget.value);
              }}
            />
          </div>
          <div className="form-group">
            <label for="break">Break (minutes):</label>
            <input
              id="break"
              type="number"
              name="break"
              value={breakMinutes()}
              min={1}
              onChange={(event) => {
                setBreak(+event.currentTarget.value);
              }}
            />
          </div>
          <button class="submit" onClick={() => setShowTimer(true)}>Lets go.</button>
        </>
      </Show>
    </main>
  );
};

export default App;
