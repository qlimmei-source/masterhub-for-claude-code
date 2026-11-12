**English** | [Русский](INSTALL.ru.md)

# MasterHub: install and use

A guide for people who have never done this. Every step says what to type and what you should see.

**Status:** covered by automated tests of the mods' code; the skills have no tests. Installing it in a live Claude Code has not been run yet, so the results below are what the documentation leads us to expect.

**Windows is the main system. MasterHub as a whole has not been tested on Mac: only the install and `/hub` were tried there** ([see the Mac section](#10-mac)).

## 1. What you need

**A terminal** is the window where you type commands. On Windows, press Start, type `PowerShell` and press Enter. On Mac, open the Terminal app. To paste a command on Windows, right-click in the window. [The Claude Code terminal guide](https://code.claude.com/docs/en/terminal-guide) shows this in more detail.

**Claude Code, version 2.1.304 or newer**, and a paid plan: the documentation says the free claude.ai plan does not include Claude Code. It also needs an internet connection. [How to install it](https://code.claude.com/docs/en/setup).

To check in a terminal, type `claude --version`. You should see a number like `2.1.318 (Claude Code)`. If the number is lower, type `claude update`. If you use only the VS Code extension, update the extension in VS Code.

**Git**, a free program Claude Code uses to fetch the set from GitHub. You do not need a GitHub account. [Download it](https://git-scm.com/downloads). After installing Git, close the terminal window and open a new one.

To check, type `git --version`. You should see a line like `git version 2.41.0.windows.3`.

**Also on Windows:**

- Windows 10 version 1809 or newer, as the Claude Code documentation requires.
- Git for Windows, which Claude Code recommends. Without it, Claude Code runs commands through PowerShell.
- Windows PowerShell, which comes with Windows. The buttons **Open folder** and **Show** use it.
- The `code` command, for the **Open** button. The VS Code installer for Windows adds it. Without it, the button shows the file in File Explorer and says so.

**Messages between chats.** The main chat passes tasks to other open chats with the Claude Code tool `SendMessage`. The documentation says it is on by default from version 2.1.234 on Windows. To check, type `/list-agents`. If that command is not recognized, you can expect helpers in one chat to keep working, and you carry messages between separate chats yourself by copying them.

## 2. Install

MasterHub comes from a catalog (in Claude Code it is called a marketplace): a list of plugins kept in one repository. You add the catalog once and install from it.

Pick your way: only the VS Code panel, take [In VS Code](#in-vs-code). Claude Code in a terminal, take [From a terminal](#from-a-terminal-one-line). Git will not install, take [From a ZIP file](#without-git-from-a-zip-file).

### In VS Code

1. In the Claude Code panel, type `/plugins`. The **Manage plugins** window opens.
2. On the **Marketplaces** tab, add `qlimmei-source/masterhub-for-claude-code`.
3. On the **Plugins** tab, find `masterhub` and press **Install**.
4. Choose **Install for you**.

### From a terminal: one line

The VS Code extension does not put `claude` in a terminal; this way needs Claude Code installed on its own, by the link in step 1.

A mod is code. You can read it in `plugins/`: about 730 lines, without tests.

```
claude plugin install masterhub --marketplace qlimmei-source/masterhub-for-claude-code
```

You should see `Successfully added marketplace: masterhub`, then `Successfully installed plugin: masterhub@masterhub (scope: user)`.

The set should then be on for all your projects, in the terminal and in VS Code alike.

### Inside Claude Code in a terminal

Type this in the chat:

```
/plugin install masterhub --marketplace qlimmei-source/masterhub-for-claude-code
```

Confirm adding the catalog. In the panel that opens, choose **Install for you (user scope)**.

### Without Git: from a ZIP file

1. On the [project's GitHub page](https://github.com/qlimmei-source/masterhub-for-claude-code), press **Code → Download ZIP**.
2. Unpack it into a folder that will stay put, for example in `Documents`.
3. Find the folder that directly contains the folder `.claude-plugin`. The archive may add one more level of folders, so check inside. Hidden folders may not show in File Explorer; `README.md` lies next to it, so look for that file.
4. In Claude Code, type this with the path to that folder. In VS Code, enter the same path on the **Marketplaces** tab of `/plugins`.

   ```
   /plugin marketplace add C:\path\to\that\folder
   ```

5. Type `/plugin install masterhub@masterhub`. In VS Code, use the **Plugins** tab.

The set then loads from that folder, so keep the folder where it is. A new version means downloading the ZIP again and replacing the files in that folder.

## 3. Check that it works

Open a **new** chat, because chats opened before the install do not see the mods.

- **In VS Code:** press `Ctrl+Shift+P`, type `Claude Code` and select **Open in New Tab**.
- **In a terminal:** type `/exit`, then type `claude` again.

Then:

1. Type `/`. The list should include the commands under either name, short or full: `hub` or `masterhub:hub`, and the same for `nextchat`, `go`, `ready`, `council`, `interview`, `graphic-design`, `motion`. It should also include `blocks` and `topic`.
2. Type `/blocks` twice. The first time should turn the colors off, the second should turn them on and show the legend.

Commands are not in the list? See [If something goes wrong](#9-if-something-goes-wrong).

## 4. First use

A project folder is the folder on your computer that holds everything for one piece of work. It can be new and empty.

**Open Claude Code in it:**

- **In VS Code:** choose **File → Open Folder** and select the folder. Then click **✻ Claude Code** in the bottom-right corner of the window.
- **In a terminal:** type `cd` and the path to the folder, press Enter, then type `claude`.

**Then:**

1. Type `/hub` (if it is not found, `/masterhub:hub`). Got `/рги` instead? The keyboard was on the Russian layout: switch it to English and type again.
2. Claude first shows in three lines what the hub is: this chat becomes the main chat of this project, what changes in the work, and that each project has its own main chat.
3. Claude reads your own rules, if you have them in `CLAUDE.md` files of the folders above, and makes the project rules follow them.
4. Claude asks a few questions in one table: the topics for your project (for example Design, Text, Prices), and whether your working files live in a folder outside the project. Say "yes" or correct them.
5. Claude creates the folders and rules in one step and says what it means for your work. This chat becomes the main chat and is named "MasterHub YOURPROJECT". The name should appear by itself.
6. Write your task in ordinary words.

If the folder already holds your work, Claude asks first. It adds its folders next to yours and moves nothing.

## 5. What each part does

### `/hub`: the main chat

One chat takes all your tasks and keeps the picture. It writes your words down exactly as you said them, gives the work to helpers in the background, and shows you results. A helper is a separate Claude that does one part of the work and reports to the main chat. Next time you open the project, type `/hub` again, and it tells you what stands where.

**When:** at the start of any project that takes more than a few hours.

### `/nextchat`: moving to a new chat

Long chats get slower and use more of your usage limit, which is how much Claude you can use on your plan. This command writes a note on where things stand and gives you one block of text. Open a new chat and paste the block. The new chat continues from the note. The last line tells you whether the old chat can be closed.

**When:** the chat has grown long, or Claude starts to forget things.

### Approval: in words

You approve a finished thing in words about it: "yes", "ok", "send it". Its status in the log `03_FINAL/README.md` becomes "approved", next to your words. After "nice", "great" or picking one of the options, Claude asks once whether you approve. Approval sends nothing to anyone: sending is a separate word from you.

**When:** you have looked at a finished thing in `03_FINAL/` and accept it.

### `/go`: all edits in one pass

Give your remarks as they come. Claude writes them down without touching the files. When you say `/go`, it applies them all at once, builds one new version and checks it. One to three small edits are made right away, without waiting.

**When:** you have a list of edits for something big.

### `/ready`: what "done" looks like

You have a general idea but no picture of every detail. Claude names the best examples of this kind of work, gives you words to steer with, asks only the questions that change the result, and quickly makes a draft of the most important piece, on one screen. Then you get a short card: what you see first, what is left out, what not to touch.

**When:** before a new page, proposal, presentation or video.

### `/council`: review by critics

Claude writes the text, then separate critics check it: for example a "Reader", who stands in for your real reader, and an "Editor", who checks each sentence. Your own decisions stay as you said them. A critic's idea that changes the meaning comes to you as a question.

**When:** before any text goes to other people. It uses extra usage limit, because the writer and each critic run as separate helpers.

### `/interview`: who you are

Claude asks one question at a time about you and your work and saves the answers in an `about-me/` folder. Any chat later reads them and knows who it works with.

### `/graphic-design`: slides, pages, covers

An order of work and layout rules in numbers: margins, sizes, contrast. A program checks the layout before you see it.

### `/motion`: short motion videos

Videos made in code (HTML and GSAP, rendered to MP4 by the free HyperFrames engine). A frame list comes before building, numbers come only from you, and every scene gets a score.

### `blocks`: colored badges

Colored badges are blocks of text with a colored background or frame. Claude starts each block with a mark, and the mod paints the block. A question for you is always first, in a red block with a frame. Paths to files become lines with **Open** buttons. Turn it off and on with `/blocks`.

The mod starts programs only when you press its buttons. [The README lists them](README.md#what-it-does-on-your-computer).

### `chat-topic`: the topic under the input box

A line under the input box shows which chat you are in. A first line "Chat: Design." sets the topic, and `/topic Prices` changes it. `/hub` should name the chat "MasterHub YOURPROJECT" by itself. After `/nextchat` the old one should become "OLD MasterHub…", so you do not mix them up. The mod reads your project's `CLAUDE.md` and the messages of the current chat.

### `no-nested-agents`: helpers cannot start helpers

A small program that stops helpers from starting their own helpers. The helper then does that part itself.

### The folder scheme

| Folder | What is in it |
|---|---|
| `00_START_HERE.md` | The map: where the current things are |
| `01_IN/` | What came from outside, as it came. Read only |
| `02_WORK/` | The work, one folder per topic |
| `03_FINAL/` | What goes out, with a log |
| `04_REF/` | References and resources |
| `08_AGENTS/` | Service files: tasks, notes for new chats, checks |
| `09_ARCHIVE/`, `_archive/` | Old things. They are kept, not deleted |

## 6. Update

A new version does not arrive by itself until you turn that on.

**In a terminal session, turn on automatic updates (once):** type `/plugin`, go to the **Marketplaces** tab, select `masterhub`, select **Enable auto-update**.

**In a terminal session, update now:** on the same tab, select `masterhub`, then **Update marketplace**.

**From a terminal, without a session:** each part of the set is its own plugin, so there is one line for each:

```
claude plugin update masterhub@masterhub
claude plugin update blocks@masterhub
claude plugin update chat-topic@masterhub
claude plugin update no-nested-agents@masterhub
```

Then type `/reload-plugins` in an open chat, or start a new chat.

**In VS Code:** the refresh icon on the **Marketplaces** tab of `/plugins` updates the list of plugins. The VS Code guide does not describe updating an installed plugin or turning on automatic updates. For those, use a terminal.

What changed is in the [CHANGELOG](CHANGELOG.md).

## 7. Turn off

**Only the colors:** type `/blocks`. Type it again to bring them back.

**The whole set, from a terminal:** each part of the set is its own plugin, so it takes four lines, in this order. The commands stay installed but do nothing until you turn them back on. If you do not plan to come back, [removing](#8-remove) is simpler: one line.

```
claude plugin disable masterhub@masterhub
claude plugin disable blocks@masterhub
claude plugin disable chat-topic@masterhub
claude plugin disable no-nested-agents@masterhub
```

To turn them back on, run the same lines with `enable` and start with `masterhub`.

**In VS Code:** installed plugins are at the top of the `/plugins` window, with a switch next to each.

The commands need the mods, so Claude Code refuses to turn off `chat-topic` or `no-nested-agents` alone while `masterhub` is on. It then prints the command that turns off both.

## 8. Remove

One line in a terminal removes the catalog and every part of the set installed from it:

```
claude plugin marketplace remove masterhub
```

Inside a terminal session, the same thing is `/plugin marketplace remove masterhub`. In VS Code, press the trash icon next to the catalog on the **Marketplaces** tab of `/plugins`.

Your projects stay as they are: folders, `CLAUDE.md`, work files. The rules in `CLAUDE.md` remain until you edit them.

## 9. If something goes wrong

| What you see | What to do |
|---|---|
| `claude` is not recognized | Claude Code is not in the terminal. Install it from the link in step 1, or use the VS Code way |
| An error about `git` | Install Git from the link in step 1, close the terminal and open a new one |
| `/hub` is not in the list | Open a new chat, or type `/reload-plugins`. Then try the full name `/masterhub:hub`. The other commands work the same way: `/masterhub:go` and so on. The short name works only when no other command on your computer is called `hub` |
| You typed `/hub` and see `/рги` | The keyboard was on the Russian layout. Switch it to English and type again |
| `/blocks` or `/topic` is not in the list | Open a new chat. In a terminal session, type `/plugin`: the line under the tabs names the mods that loaded |
| No colors | Open a new chat. Check the version in step 1. Type `/blocks` in case they were turned off |
| The topic does not show | The same: a new chat, and check the version |
| A plugin fails to load | In a terminal session, type `/plugin` and open the **Errors** tab |

**Still stuck?** Copy the exact text of the error. Either show it to Claude in a chat, or write it in the project's [Issues on GitHub](https://github.com/qlimmei-source/masterhub-for-claude-code/issues). The official guides cover [installing plugins](https://code.claude.com/docs/en/plugins/install) and [fixing plugin errors](https://code.claude.com/docs/en/plugins/troubleshooting).

## 10. Mac

On Mac, a tester installed an early version and set up a project with `/hub`. The answer field and the buttons of `blocks` have their own Mac commands (`open`, `code`, `osascript`) and have not been tried on a real Mac yet. The first time **File…** or **Paste screenshot** runs, macOS may ask to let the editor control the computer or read the clipboard: allow it. If you try it, please write what happened in the project's [Issues](https://github.com/qlimmei-source/masterhub-for-claude-code/issues).
