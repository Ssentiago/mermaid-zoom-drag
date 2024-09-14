Demo for PC:

![](https://github.com/gitcpy/mermaid-zoom-drag/blob/main/gifs/mermaid-zoom-drag-demo.gif)

Demo for Mobile:

![](https://github.com/gitcpy/mermaid-zoom-drag/blob/main/gifs/mermaid-zoom-drag-demo-for-mobile.gif)

1. About

   In obsidian, when you have a md file which contains large charts or diagrams, maybe something else of mermaid, you will see those things are too large to show completely in mermaid window.
   So i think it is a good way to take the obsidian plugin here. It adapts those things of mermaid, and it could easily that let you zoom in or zoom-out or drag. Enjoy it!

2. Get it

   2.1 From Github

   2.1.1 Download and Install

   Way 1.

    	Download code zip file and unzip it, or you just pull it from github.
    
   	Anyway you like. Then you will get a doc named mermaid-zoom-drag-main, rename it to mermain-zoom-drag-main.
   	
   	Just put the doc in the position, if your system is windows, it will be like this "your_obsidian_vault_path/.obsidian/plugins/mermaid-zoom-drag-plug".
   	
   	Reload your obsidian app, and you will see the option in "community plugins" -> "installed plugins", and click the switcher.

   	Way 2.

      	Also you could get it by BRAT plugin from the "Community plugins" in Obsidian.
      	
      	Install BRAT plugin from the "Community plugins".
      
   	Go to the option or settings of it, click "Add Beta Plugin", and then fill in the repository textbox: https://github.com/gitcpy/mermaid-zoom-drag.git.

      	After that, click "Add plugin". A moment later, you will see the plugin in the list of installed plugins. Just enable if you in need, or disable it.

   Way 3.
   Directly From Obsidian Community Plugin Browser

   	(to be continued...)

3. Usage

   After installed, When you read in obsidian, if there ia any mermaid, you just put your cursor inside it in reading mode.


   You will have the following options:

    - Keyboard:
        - `CTRL` + `+`/`=`: zoom in
        - `CTRL` + `-`: zoom out
        - `CTRL` + `0`: reset zoom and position
        - ArrowUp, ArrowDown, ArrowLeft, ArrowRight: moves the diagram to the specified side

    - Mouse:
        - Mouse down + move: moves the diagram to the specified side
        - `CTRL` + wheel: zoom in / zoom out the diagram

    - Control Panels:
        - Service panel at the top right corner:
            - Hide / show action: hide / show other panels
            - Open in fullscreen mode / exit fullscreen mode: enables or disables fullscreen mode 
              for the 
              diagram

        - Zoom panel at the right edge at the center:
            - Zoom in: zoom in the diagram
            - Reset zoom and position: reset zoom and position of the diagram
            - Zoom out: zoom out the diagram

        - Move panel at the bottom:
            - All actions move the diagram to the specified side

5. Example

   	4.1 Mermaid code

   ```mermaid
   flowchart LR
   Test_Mermaid_Diagram
   Start --> Stop
   ```

   4.2 Click the copy button at right top of the mermaid diagrams above to copy the code, and paste it in your md file in obsidian, and try as "3.

