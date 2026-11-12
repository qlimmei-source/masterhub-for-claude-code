declare module 'claude-code' {
  interface PluginState {
    blocks: { isOff: boolean; sent: StateFamily<boolean>; copied: StateFamily<boolean>; opened: StateFamily<boolean>; saved: StateFamily<string>; files: StateFamily<string[]>; changing: StateFamily<boolean> }
  }
}
