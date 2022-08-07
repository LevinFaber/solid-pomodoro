import { createSignal, Show } from "solid-js";

export default function Notification () { 
  const [permission, setPermission] = createSignal(window.Notification.permission);

  const enableNotifications = async () => {
    const newPermission = await window.Notification.requestPermission();
    setPermission(newPermission);
  }
  
  return (<Show when={permission() === "default"}>
    <button onClick={enableNotifications}>Enable Notifications</button>
  </Show>)
}