import { AssetPack, AssetType } from '@VCRE/core/gamedata';
import { FileSystemFileHandle } from 'native-file-system-adapter';

import { Model } from './Model';
import { ModelBuilder } from './ModelBuilder';

export enum ModelPackName {
    P_COMMON = 'P_COMMON.BIN',
    P_STG1C = 'P_STG1C.BIN',
    P_STG10 = 'P_STG10.BIN',
    P_STG11 = 'P_STG11.BIN',
    P_STG12 = 'P_STG12.BIN',
    // P_OPTION = 'P_OPTION.BIN',
    P_SEL = 'P_SEL.BIN',
    P_STG2C = 'P_STG2C.BIN',
    P_STG20 = 'P_STG20.BIN',
    P_STG21 = 'P_STG21.BIN',
    P_STG22 = 'P_STG22.BIN',
    P_STG3C = 'P_STG3C.BIN',
    P_STG30 = 'P_STG30.BIN',
    P_STG31 = 'P_STG31.BIN',
    P_STG32 = 'P_STG32.BIN',
    P_FANG = 'P_FANG.BIN',
    P_ADV = 'P_ADV.BIN',
    P_NAME = 'P_NAME.BIN',
    P_MINI_C = 'P_MINI_C.BIN',
}

// enum TexturePackType {
//     Common = 0,
//     Matching = 6
// }

export class ModelPack extends AssetPack {
    public readonly assetType: AssetType = AssetType.Model;
    public readonly isStage: boolean;

    public models: Model[] = [];

    constructor(file: FileSystemFileHandle) {
        super(file);

        this.isStage = file.name.startsWith('P_STG') && !file.name.endsWith('C.BIN');
    }

    protected override async _init(): Promise<void> {
        await super._init();

        let id = 0;
        while (true) {
            const model = ModelBuilder.build(id++, this, this.buffer);
            if (!model) {
                break; // All models have been read
            }

            this.models.push(model);
        }
    }

    public getModel(id: number): Model | undefined {
        return this.models[id];
    }
}