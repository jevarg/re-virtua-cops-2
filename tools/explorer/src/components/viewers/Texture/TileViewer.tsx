import './TileViewer.css';

import { Card, Divider, Text } from '@geist-ui/core';
import { AssetType, GameData, TexturePackName, Tile} from '@VCRE/core/gamedata';
import { useEffect, useRef } from 'react';

export type TileViewerProps = {
    textureFileName: TexturePackName;
    tile?: Tile;
}

function NoTileSelected() {
    return <Card.Content className='no-tile-selected' height="90%">
        <Text type='secondary' span h4>No tile selected...</Text>
        <Text type='secondary' span small>Select a tile to get more information about it</Text>
    </Card.Content>;
}

function TileViewerCard({ children }: React.PropsWithChildren) {
    return <Card width="100%">
        <Card.Content>
            <Text b>Tile Info</Text>
        </Card.Content>
        <Divider h="1px" my={0} />
        <Card.Content className='tile-viewer-main-content'>
            {children}
        </Card.Content>
    </Card>;
}

export function TileViewer({ textureFileName, tile }: TileViewerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const gameData = GameData.get();
        if (!canvasRef?.current || !tile || !gameData.assets) {
            console.error('err');
            return;
        }

        canvasRef.current.width = tile.rect.width;
        canvasRef.current.height = tile.rect.height;

        const textureFile = gameData.assets[AssetType.Texture].get(textureFileName);
        if (!textureFile) {
            console.error('No texture file');
            return;
        }

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) {
            console.error('no ctx');
            return;
        }

        const texture = textureFile.getTexture(tile.textureId);
        const imageData = ctx.createImageData(tile.rect.width, tile.rect.height);
        imageData.data.set(texture.pixels);
        ctx.putImageData(imageData, 0, 0);

    }, [textureFileName, tile]);

    if (!tile) {
        return <TileViewerCard>
            <NoTileSelected />
        </TileViewerCard>;
    }

    return <TileViewerCard>
        <canvas ref={canvasRef} className='tile-canvas'></canvas>
        {/* KONVA STAGE HERE */}
    </TileViewerCard>;
}