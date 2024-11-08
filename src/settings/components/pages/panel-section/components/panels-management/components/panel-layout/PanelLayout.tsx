import { useSettingsContext } from '../../../../../../core/context';
import React, { useEffect, useRef, useState } from 'react';
import { DragItem } from './typing/interfaces';
import {
    DiagramPreview,
    DiagramSetup,
    FoldPanel,
    PanelControl,
    PanelPreview,
    PanelToggle,
} from './styled/styled';
import {
    PanelPosition,
    PanelsConfig,
} from '../../../../../../../typing/interfaces';
import { Platform } from 'obsidian';

/**
 * A component that renders a diagram of the panel layout and allows the user
 * to drag and drop panels to change their positions and enable or disable them
 *
 * @returns A `DiagramSetup` component that contains a `DiagramPreview` and a
 * `PanelControl`.
 */
const PanelLayout: React.FC = () => {
    const { plugin } = useSettingsContext();
    const [positions, setPositions] = useState<PanelsConfig>(
        plugin.settings.panelsConfig
    );
    const [draggedPanel, setDraggedPanel] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setPositions(plugin.settings.panelsConfig);
    }, [plugin.settings]);

    const saveSettings = async (newPositions: PanelsConfig): Promise<void> => {
        setPositions(newPositions);
        plugin.settings.panelsConfig = newPositions;
        await plugin.settingsManager.saveSettings();
    };

    const togglePanelState = async (
        panelName: keyof PanelsConfig
    ): Promise<void> => {
        const newPositions = {
            ...positions,
            [panelName]: {
                ...positions[panelName],
                enabled: !positions[panelName].enabled,
            },
        };
        await saveSettings(newPositions);
    };

    const handleDragStart = (e: React.DragEvent, panelName: string): void => {
        const panel = e.currentTarget as HTMLElement;
        const rect = panel.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        e.dataTransfer.setData(
            'application/json',
            JSON.stringify({
                panelName,
                offsetX,
                offsetY,
            })
        );
        setDraggedPanel(panelName);
    };

    const calculatePosition = (
        x: number,
        y: number,
        containerRect: DOMRect
    ): PanelPosition => {
        const position: PanelPosition = {};

        const PANEL_WIDTH = 60;
        const PANEL_HEIGHT = 40;
        const SNAP_THRESHOLD = 30;

        // Coordinates of the panel edges
        const panelLeft = x;
        const panelRight = x + PANEL_WIDTH;
        const panelTop = y;
        const panelBottom = y + PANEL_HEIGHT;

        // Distances from the edges of the panel to the edges of the container
        const distanceToLeft = panelLeft;
        const distanceToRight = containerRect.width - panelRight;
        const distanceToTop = panelTop;
        const distanceToBottom = containerRect.height - panelBottom;

        // Find the minimum distance to the edge
        const distances = [
            { edge: 'left', value: distanceToLeft },
            { edge: 'right', value: distanceToRight },
            { edge: 'top', value: distanceToTop },
            { edge: 'bottom', value: distanceToBottom },
        ];

        const closestEdge = distances.reduce((a, b) =>
            Math.abs(a.value) < Math.abs(b.value) ? a : b
        );

        // Attach to the nearest edge if in the attraction zone
        if (Math.abs(closestEdge.value) <= SNAP_THRESHOLD) {
            switch (closestEdge.edge) {
                case 'left':
                    position.left = '0px';
                    // Calculate vertical position
                    if (panelTop <= SNAP_THRESHOLD) {
                        position.top = '0px';
                    } else if (
                        containerRect.height - panelBottom <=
                        SNAP_THRESHOLD
                    ) {
                        position.bottom = '0px';
                    } else {
                        position.top = `${((panelTop / containerRect.height) * 100).toFixed(1)}%`;
                    }
                    break;

                case 'right':
                    position.right = '0px';
                    if (panelTop <= SNAP_THRESHOLD) {
                        position.top = '0px';
                    } else if (
                        containerRect.height - panelBottom <=
                        SNAP_THRESHOLD
                    ) {
                        position.bottom = '0px';
                    } else {
                        position.top = `${((panelTop / containerRect.height) * 100).toFixed(1)}%`;
                    }
                    break;

                case 'top':
                    position.top = '0px';
                    if (panelLeft <= SNAP_THRESHOLD) {
                        position.left = '0px';
                    } else if (
                        containerRect.width - panelRight <=
                        SNAP_THRESHOLD
                    ) {
                        position.right = '0px';
                    } else {
                        position.left = `${((panelLeft / containerRect.width) * 100).toFixed(1)}%`;
                    }
                    break;

                case 'bottom':
                    position.bottom = '0px';
                    if (panelLeft <= SNAP_THRESHOLD) {
                        position.left = '0px';
                    } else if (
                        containerRect.width - panelRight <=
                        SNAP_THRESHOLD
                    ) {
                        position.right = '0px';
                    } else {
                        position.left = `${((panelLeft / containerRect.width) * 100).toFixed(1)}%`;
                    }
                    break;
            }
        } else {
            // If not in the attraction zone, use exact coordinates
            position.left = `${((panelLeft / containerRect.width) * 100).toFixed(1)}%`;
            position.top = `${((panelTop / containerRect.height) * 100).toFixed(1)}%`;
        }

        return position;
    };

    const handleDrop = async (e: React.DragEvent): Promise<void> => {
        e.preventDefault();
        const container = containerRef.current;
        if (!container) {
            return;
        }

        const containerRect = container.getBoundingClientRect();
        const data = JSON.parse(
            e.dataTransfer.getData('application/json')
        ) as DragItem & { offsetX: number; offsetY: number };

        const x = e.clientX - containerRect.left - data.offsetX;
        const y = e.clientY - containerRect.top - data.offsetY;

        const position = calculatePosition(x, y, containerRect);

        const newPositions = { ...positions };
        newPositions[data.panelName as keyof PanelsConfig] = {
            ...positions[data.panelName as keyof PanelsConfig],
            position,
        };

        await saveSettings(newPositions);
        setDraggedPanel(null);
    };

    const handleTouchStart = (e: React.TouchEvent, panelName: string): void => {
        const touch = e.touches[0];
        const panel = e.target as HTMLElement;
        const rect = panel.getBoundingClientRect();
        const offsetX = touch.clientX - rect.left;
        const offsetY = touch.clientY - rect.top;
        setDraggedPanel(panelName);
        panel.dataset.dragData = JSON.stringify({
            panelName,
            offsetX,
            offsetY,
        });
    };

    const handleTouchMove = (e: React.TouchEvent): void => {
        const container = containerRef.current;
        if (!container || !draggedPanel) {
            return;
        }
        e.preventDefault();

        const touch = e.touches[0];
        const panel = e.currentTarget as HTMLElement;
        const dragData = JSON.parse(panel.dataset.dragData ?? '{}');
        const containerRect = container.getBoundingClientRect();
        const x = touch.clientX - containerRect.left - dragData.offsetX;
        const y = touch.clientY - containerRect.top - dragData.offsetY;
        const position = calculatePosition(x, y, containerRect);

        panel.style.left = position.left!;
        panel.style.top = position.top!;
    };

    const handleTouchEnd = async (e: React.TouchEvent): Promise<void> => {
        const container = containerRef.current;
        if (!container || !draggedPanel) {
            return;
        }

        const panel = e.currentTarget as HTMLElement;
        const dragData = JSON.parse(panel.dataset.dragData ?? '{}');
        const touch = e.changedTouches[0];

        const containerRect = container.getBoundingClientRect();
        const x = touch.clientX - containerRect.left - dragData.offsetX;
        const y = touch.clientY - containerRect.top - dragData.offsetY;

        const position = calculatePosition(x, y, containerRect);

        const newPositions = { ...positions };
        newPositions[dragData.panelName as keyof PanelsConfig] = {
            ...positions[dragData.panelName as keyof PanelsConfig],
            position,
        };

        await saveSettings(newPositions);
        setDraggedPanel(null);
    };

    const panelProps = (
        name: string
    ):
        | { draggable: true; onDragStart: (e: React.DragEvent) => void }
        | {
              onTouchStart: (e: React.TouchEvent) => void;
              onTouchMove: (e: React.TouchEvent) => void;
              onTouchEnd: (e: React.TouchEvent) => Promise<void>;
          } =>
        Platform.isDesktop
            ? {
                  draggable: true,
                  onDragStart: (e: React.DragEvent): void =>
                      handleDragStart(e, name),
              }
            : {
                  onTouchStart: (e: React.TouchEvent) =>
                      handleTouchStart(e, name),
                  onTouchMove: handleTouchMove,
                  onTouchEnd: handleTouchEnd,
              };

    return (
        <DiagramSetup>
            <DiagramPreview
                ref={containerRef}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
            >
                {Object.entries(positions).map(
                    ([name, config]) =>
                        config.enabled && (
                            <PanelPreview
                                key={name}
                                dragging={draggedPanel === name}
                                style={{
                                    ...config.position,
                                }}
                                {...panelProps(name)}
                            >
                                {name}
                            </PanelPreview>
                        )
                )}
                <FoldPanel>fold</FoldPanel>
            </DiagramPreview>

            <PanelControl>
                {Object.entries(positions).map(([name, config]) => (
                    <PanelToggle key={name}>
                        <input
                            type="checkbox"
                            checked={config.enabled}
                            onChange={() =>
                                togglePanelState(name as keyof PanelsConfig)
                            }
                        />
                        {name}
                    </PanelToggle>
                ))}
            </PanelControl>
        </DiagramSetup>
    );
};

export default PanelLayout;
