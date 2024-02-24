import { useEffect, useRef } from 'react';
import './TextureViewer.css';
import { TileMap } from '../../core/gamedata/Textures/TileMap';
import Konva from 'konva';
import { TexturesFile } from '../../core/gamedata/Textures/TexturesFile';

export interface TextureViewerProps {
    textureFile: TexturesFile;
}

// export function TextureViewer({ texture }: TextureViewerProps) {
//     const canvasRef = useRef<HTMLCanvasElement>(null);

//     useEffect(() => {
//         const ctx = canvasRef.current?.getContext('2d');
//         if (!ctx) {
//             return;
//         }

//         canvasRef.current!.width = texture.info.width;
//         canvasRef.current!.height = texture.info.height;

//         const imageData = new ImageData(texture.pixels, texture.info.width, texture.info.height);
//         ctx.putImageData(imageData, 0, 0);
//     }, [texture]);

//     return (
//         <canvas className='tilemap-container' ref={canvasRef} />
//     );
// }

function buildTileMap(textureFile: TexturesFile, layer: Konva.Layer) {
    if (!textureFile.tileMap) {
        console.warn('tileMap is not set!');
        return;
    }

    const group = new Konva.Group();

    let i = 0;
    for (const tile of textureFile.tileMap) {
        i++;
        const texture = textureFile.getTexture(tile.textureId);
        if (!texture) {
            continue;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.log('qwewqwqe');
            continue;
        }

        canvas.width = texture.info.width;
        canvas.height = texture.info.height;

        const imageData = new ImageData(texture.pixels, texture.info.width, texture.info.height);
        ctx.putImageData(imageData, 0, 0);

        Konva.Image.fromURL(canvas.toDataURL(), function(image) {
            image.setAttrs({
                x: tile.position.x,
                y: tile.position.y,
            });

            // image.on('mouseenter', (e) => {
            //     console.log(e.target!);
            // });

            group.add(image);
        });
    }

    console.log(i);

    layer.add(group);
}

function createStage(container: HTMLDivElement) {
    const stage = new Konva.Stage({
        container,
        width: container.clientWidth,
        height: container.clientHeight,
        draggable: true,
    });

    stage.on('wheel', (e) => {
        e.evt.preventDefault();

        if (!e.evt.deltaY) {
            return;
        }

        const scale = stage.scale() || { x: 1, y: 1 };
        const pointer = stage.getPointerPosition()!;
        const mousePos = {
            x: (pointer.x - stage.x()) / scale.x,
            y: (pointer.y - stage.y()) / scale.y,
        };

        if (e.evt.deltaY > 0) {
            scale.x = Math.max(0.5, scale.x - 0.5);
            scale.y = Math.max(0.5, scale.y - 0.5);
        } else {
            scale.x = Math.max(0.5, scale.x + 0.5);
            scale.y = Math.max(0.5, scale.y + 0.5);
        }

        stage.scale(scale);
        stage.position({
            x: pointer.x - mousePos.x * scale.x,
            y: pointer.y - mousePos.y * scale.y
        });
    });

    return stage;
}

function updateLayout(stage: Konva.Stage) {
    const container = stage.container();

    stage.size({
        width: container.clientWidth,
        height: container.clientHeight
    });
}

export function TextureViewer({ textureFile }: TextureViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        const stage = createStage(containerRef.current);
        const onWindowResized = () => updateLayout(stage);
        const layer = new Konva.Layer({
            imageSmoothingEnabled: false
        });

        stage.add(layer);
        buildTileMap(textureFile, layer);

        window.addEventListener('resize', onWindowResized);
        return () => {
            window.removeEventListener('resize', onWindowResized);
        };
    }, [textureFile]);

    return (
        <div className='tilemap-container' ref={containerRef} ></div>
    );
}