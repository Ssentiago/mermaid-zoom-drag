import {MarkdownView, Plugin, setIcon} from 'obsidian';

export default class MermaidZoomDragPlugin extends Plugin {
    private dx = 0;
    private dy = 0
    private scale = 1;

    async onload() {
        this.registerMarkdownPostProcessor((element, context) => {
            this.initializeMermaidFeatures(element);
        });

        this.registerEvent(this.app.workspace.on('layout-change', () => {
            const view = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (view && view.getViewType() === 'markdown') {
                const markdownView = view as MarkdownView;
                this.initializeMermaidFeatures(markdownView.contentEl);
            }
        }));
    }

    initializeMermaidFeatures(ele: HTMLElement) {
        const observer = new MutationObserver(() => {
            this.initializeMermaidElements(ele);
        });

        observer.observe(ele, {childList: true, subtree: true});
        this.initializeMermaidElements(ele);
    }

    initializeMermaidElements(ele: HTMLElement) {
        const isEditing = ele.classList.contains('cm-s-obsidian');
        if (isEditing) {
            const codeBlocks = ele.querySelectorAll('pre > code.language-mermaid');
            codeBlocks.forEach((block) => {
                const mermaidElement = document.createElement('div');
                mermaidElement.className = 'mermaid';
                mermaidElement.textContent = block.textContent || '';

                if (block.parentNode) {
                    const block_parentNode_Element = block.parentNode as Element;
                    block_parentNode_Element.replaceWith(mermaidElement);
                }

                this.addMermaidContainers(mermaidElement);
                this.addMouseEvents(mermaidElement);
            });
        } else {
            setTimeout(() => {
                this.addMermaidContainers(ele);
                this.addMouseEvents(ele);
            }, 100);
        }
    }

    addMermaidContainers(ele: HTMLElement) {
        const mermaidElements = ele.querySelectorAll('.mermaid');
        mermaidElements.forEach((el) => {
            if (!el.parentElement?.classList.contains('mermaid-container')) {
                const container = document.createElement('div');
                container.className = 'mermaid-container';
                container.setCssStyles({
                    position: 'relative',
                    overflow: 'hidden',
                    width: '100%',
                    height: '70vh'
                });

                el.parentNode?.insertBefore(container, el);
                container.appendChild(el);
                const el_html = el as HTMLElement;
                el_html.setCssStyles({
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    transformOrigin: 'top left',
                    cursor: 'grab',
                    width: '100%',
                    height: '100%'
                });

                this.addControlPanel(container);
                setTimeout(() => {
                    this.fitToContainer(el as HTMLElement, container);
                }, 100);
            }
        });
    }

    /**
     * Adds a control panel to the provided container element.
     * The control panel includes buttons for moving and zooming the element.
     *
     * @param {HTMLElement} container - The container element to which the control panel will be added.
     */
    addControlPanel(container: HTMLElement) {
        const panelStyles = {
            position: 'absolute',
            bottom: '10px',
            display: 'grid',
            gap: '5px',
            background: 'transparent',
            padding: '5px',
            borderRadius: '5px',
            boxShadow: 'none'
        };

        /**
         * Creates a new HTML panel element with the specified class name and styles.
         *
         * @param {string} className - The class name to be assigned to the panel element.
         * @param {object} styles - An object containing the styles to be applied to the panel element.
         * @return {HTMLElement} The created panel element.
         */
        const createPanel = (className: string, styles: object): HTMLElement => {
            const panel = document.createElement('div');
            panel.className = className;
            panel.setCssStyles(styles);
            return panel;
        };

        /**
         * Creates a new HTML button element with the specified icon, action, title, and styles.
         *
         * @param {string} icon - The icon to be displayed in the button.
         * @param {() => void} action - The action to be performed when the button is clicked.
         * @param {string} title - The title of the button for accessibility purposes.
         * @param {boolean} active - Whether the button is active or not.
         * @param {string | undefined} id - The id of the button.
         * @return {HTMLElement} The created button element.
         */
        const createButton = (icon: string, action: () => void, title: string, active: boolean = true, id: string | undefined): HTMLElement => {
            const button = document.createElement('button');
            button.className = 'button';
            button.id = id || ''
            button.setCssStyles({
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '3px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'background-color 0.2s ease',
                pointerEvents: active ? 'auto' : 'none'
            });
            setIcon(button, icon);
            button.addEventListener('click', action);
            button.addEventListener('mouseenter', () => {
                button.setCssStyles({
                    color: 'var(--interactive-accent)'
                });
            });
            button.addEventListener('mouseleave', () => {
                button.setCssStyles({
                    color: 'var(--text-muted)'
                });
            });
            button.setAttribute('aria-label', title);
            return button;
        };


        const movePanel = createPanel('mermaid-move-panel', {
            ...panelStyles,
            right: '10px',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(3, 1fr)'
        });
        let hiding = false


        const hideBtnIcon = () => hiding ? 'eye-off' : 'eye'


        const hideShowAction = () => {
            hiding = !hiding
            for (const container of [movePanel, zoomPanel]) {
                container.querySelectorAll('.button').forEach(button => {
                    const el = button as HTMLElement
                    if (el.id === 'hide-show-button-mermaid') return
                    el.setCssStyles({
                        visibility: hiding ? 'hidden' : 'visible',
                        pointerEvents: hiding ? 'none' : 'auto'
                    });
                })
            }
            const button = document.getElementById('hide-show-button-mermaid')
            if (!button) return
            setIcon(button, hideBtnIcon())
            button.setAttribute('aria-label', `${hiding ? 'Show' : 'Hide'} control panel`);
        }


        const moveButtons = [
            {icon: 'arrow-up-left', action: () => this.moveElement(container, 50, 50), title: 'Move up left'},
            {icon: 'arrow-up', action: () => this.moveElement(container, 0, 50), title: 'Move up'},
            {icon: 'arrow-up-right', action: () => this.moveElement(container, -50, 50), title: 'Move up right'},
            {icon: 'arrow-left', action: () => this.moveElement(container, 50, 0), title: 'Move left'},
            {
                icon: hideBtnIcon(), action: hideShowAction, title: `Hide control panel`, active: true,
                id: 'hide-show-button-mermaid'
            },
            {icon: 'arrow-right', action: () => this.moveElement(container, -50, 0), title: 'Move right'},
            {icon: 'arrow-down-left', action: () => this.moveElement(container, 50, -50), title: 'Move down left'},
            {icon: 'arrow-down', action: () => this.moveElement(container, 0, -50), title: 'Move down'},
            {icon: 'arrow-down-right', action: () => this.moveElement(container, -50, -50), title: 'Move down right'}
        ];

        moveButtons.forEach(btn => movePanel.appendChild(createButton(btn.icon, btn.action, btn.title, btn.active, btn.id)));
        container.appendChild(movePanel);


        const zoomPanel = createPanel('mermaid-zoom-panel', {
            ...panelStyles,
            right: 'calc(10px + 110px)',
            gridTemplateColumns: 'repeat(3, 1fr)'
        });

        const zoomButtons = [
            {icon: 'zoom-out', action: () => this.zoomElement(container, 0.9), title: 'Zoom Out'},
            {icon: 'refresh-cw', action: () => this.resetZoomAndMove(container), title: 'Reset Zoom and Position'},
            {icon: 'zoom-in', action: () => this.zoomElement(container, 1.1), title: 'Zoom In'}
        ];

        zoomButtons.forEach(btn => zoomPanel.appendChild(createButton(btn.icon, btn.action, btn.title, true, undefined)));
        container.appendChild(zoomPanel);
    }

    /**
     * Move the mermaid element in the container by the specified amount.
     * @param container - The container element that contains the mermaid element.
     * @param dx - The number of pixels to move the element horizontally.
     * @param dy - The number of pixels to move the element vertically.
     */
    moveElement(container: HTMLElement, dx: number, dy: number) {
        const element = container.querySelector('.mermaid') as HTMLElement;
        if (element) {
            this.dx += dx;
            this.dy += dy;
            element.setCssStyles({
                transform: `translate(${this.dx}px, ${this.dy}px) scale(${this.scale})`
            });
        }
    }

    /**
     * Zoom the mermaid element in the container by the specified factor.
     * The element is zoomed relative to the center of the container.
     * @param container - The container element that contains the mermaid element.
     * @param factor - The factor by which to zoom the element.
     */
    zoomElement(container: HTMLElement, factor: number) {
        const element = container.querySelector('.mermaid') as HTMLElement;
        if (element) {
            const containerRect = container.getBoundingClientRect();

            const centerX = containerRect.width / 2;
            const centerY = containerRect.height / 2;

            const offsetX = (centerX - this.dx) / this.scale;
            const offsetY = (centerY - this.dy) / this.scale;

            this.scale *= factor;

            this.dx = centerX - offsetX * this.scale;
            this.dy = centerY - offsetY * this.scale;

            element.setCssStyles({
                transform: `translate(${this.dx}px, ${this.dy}px) scale(${this.scale})`
            });
        }
    }

    /**
     * Resets the zoom and move state of the mermaid element to its original
     * size and position.
     * @param container - The container element that contains the mermaid element.
     */
    resetZoomAndMove(container: HTMLElement) {
        const element = container.querySelector('.mermaid') as HTMLElement;
        if (element) {
            this.fitToContainer(element, container)
        }
    }

    fitToContainer(element: HTMLElement, container: HTMLElement) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const mermaidWidth = element.scrollWidth;
        const mermaidHeight = element.scrollHeight;

        this.scale = Math.min(containerWidth / mermaidWidth, containerHeight / mermaidHeight, 1);
        this.dx = (containerWidth - mermaidWidth * this.scale) / 2;
        this.dy = (containerHeight - mermaidHeight * this.scale) / 2;

        element.setCssStyles({
            transform: `translate(${this.dx}px, ${this.dy}px) scale(${this.scale})`,
            transformOrigin: 'top left'
        });
    }

    addMouseEvents(ele: HTMLElement) {
        let startX: number, startY: number, initialX: number, initialY: number;
        let isDragging = false;

        const isEditing = ele.classList.contains('cm-s-obsidian');
        const mermaidContainers = isEditing ? ele.querySelectorAll('.mermaid') : ele.querySelectorAll('.mermaid-container');
        mermaidContainers.forEach((container) => {
            const mermaidElement = isEditing ? container : container.querySelector('.mermaid') as HTMLElement;
            const md_HTMLElement = mermaidElement as HTMLElement;

            if (!container.classList.contains('events-bound')) {
                container.classList.add('events-bound');

                container.addEventListener('wheel', (event) => {
                    const event_WheelEvent = event as WheelEvent;
                    if (!event_WheelEvent.ctrlKey) return;
                    event_WheelEvent.preventDefault();
                    const rect = mermaidElement.getBoundingClientRect();
                    const offsetX = event_WheelEvent.clientX - rect.left;
                    const offsetY = event_WheelEvent.clientY - rect.top;

                    const prevScale = this.scale;
                    this.scale += event_WheelEvent.deltaY * -0.001;
                    this.scale = Math.min(Math.max(.125, this.scale), 4);

                    const dx = offsetX * (1 - this.scale / prevScale);
                    const dy = offsetY * (1 - this.scale / prevScale);

                    this.dx += dx;
                    this.dy += dy;

                    md_HTMLElement.setCssStyles({
                        transform: `translate(${this.dx}px, ${this.dy}px) scale(${this.scale})`
                    });
                });

                container.addEventListener('mousedown', (event) => {
                    const event_MouseEvent = event as MouseEvent;
                    if (event_MouseEvent.button !== 0) return;

                    isDragging = true;
                    const win_ele_style = md_HTMLElement.win.getComputedStyle(md_HTMLElement);
                    startX = event_MouseEvent.clientX;
                    startY = event_MouseEvent.clientY;

                    initialX = this.dx;
                    initialY = this.dy;
                    md_HTMLElement.setCssStyles({
                        cursor: 'grabbing'
                    });
                    event.preventDefault();
                });

                container.addEventListener('mousemove', (event) => {
                    if (!isDragging) return;

                    const event_MouseEvent = event as MouseEvent;
                    const dx = event_MouseEvent.clientX - startX;
                    const dy = event_MouseEvent.clientY - startY;
                    this.dx = initialX + dx;
                    this.dy = initialY + dy;
                    md_HTMLElement.setCssStyles({
                        transform: `translate(${this.dx}px, ${this.dy}px) scale(${this.scale})`
                    });
                });

                container.addEventListener('mouseup', () => {
                    if (isDragging) {
                        isDragging = false;
                        md_HTMLElement.setCssStyles({cursor: 'grab'});
                    }
                });

                container.addEventListener('mouseleave', () => {
                    if (isDragging) {
                        isDragging = false;
                        md_HTMLElement.setCssStyles({cursor: 'grab'});
                    }
                })
            }
        });
    }


}