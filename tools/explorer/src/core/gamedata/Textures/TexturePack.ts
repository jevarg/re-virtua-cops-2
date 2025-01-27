import { AssetPack, AssetType } from '@VCRE/core/gamedata';
import { FileSystemFileHandle } from 'native-file-system-adapter';

import { Palette } from './PaletteFile';
import { Texture } from './Texture';
import { TextureFlag, TextureInfo } from './TextureInfo';
import { TileMap } from './TileMap';

export enum TexturePackName {
    T_COMMON = 'T_COMMON.BIN',
    T_STG1C = 'T_STG1C.BIN',
    T_STG10 = 'T_STG10.BIN',
    T_STG11 = 'T_STG11.BIN',
    T_STG12 = 'T_STG12.BIN',
    T_OPTION = 'T_OPTION.BIN',
    T_SELECT = 'T_SELECT.BIN',
    T_STG2C = 'T_STG2C.BIN',
    T_STG20 = 'T_STG20.BIN',
    T_STG21 = 'T_STG21.BIN',
    T_STG22 = 'T_STG22.BIN',
    T_STG3C = 'T_STG3C.BIN',
    T_STG30 = 'T_STG30.BIN',
    T_STG31 = 'T_STG31.BIN',
    T_STG32 = 'T_STG32.BIN',
    T_FANG = 'T_FANG.BIN',
    T_ADV = 'T_ADV.BIN',
    T_NAME = 'T_NAME.BIN',
    T_LOGO = 'T_LOGO.BIN',
    T_TITLE = 'T_TITLE.BIN',
    T_MINI_C = 'T_MINI_C.BIN',
    T_RANK = 'T_RANK.BIN',
}

export class TexturePack extends AssetPack {
    public readonly assetType: AssetType = AssetType.Texture;
    public readonly count: number;
    public readonly pageSize: number;
    public readonly pageOffset: number;

    private readonly _palette: Palette;
    private readonly _metadata: ArrayBuffer;

    public tileMap: TileMap | undefined;
    public textures: Texture[] = [];

    constructor(file: FileSystemFileHandle, palette: Palette, count: number, metadata: ArrayBuffer, pageSize: number, pageOffset: number) {
        super(file);

        this.count = count;
        this.pageSize = pageSize;
        this.pageOffset = pageOffset;
        this._palette = palette;
        this._metadata = metadata;
    }

    protected override async _init(): Promise<void> {
        await super._init();

        let filePos = 0;
        for (let i = 0; i < this.count; i++) {
            const info = new TextureInfo(this._metadata, TextureInfo.byteSize * i);
            const byteSize = info.width * info.height;
            const indices = this.buffer.sliceAt(filePos, byteSize);
            const pixels = this._palette.getPixels(new Uint8Array(indices), info.paletteOffset, info.hasFlag(TextureFlag.Alpha));

            this.textures.push(new Texture(i, filePos, info, pixels));
            filePos += byteSize;
        }

        this.tileMap = new TileMap(this.textures);
    }

    public getTexture(id: number): Texture | undefined {
        const i = id;
        const texture = this.textures[i];
        if (!texture) {
            return;
        }

        return texture;
    }
}