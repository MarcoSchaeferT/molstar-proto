/**
 * Copyright (c) 2019 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { createPlugin, DefaultPluginSpec } from 'mol-plugin';
import './index.html'
import { PluginContext } from 'mol-plugin/context';
import { PluginCommands } from 'mol-plugin/command';
import { StateTransforms } from 'mol-plugin/state/transforms';
import { StructureRepresentation3DHelpers } from 'mol-plugin/state/transforms/representation';
import { Color } from 'mol-util/color';
import { PluginStateObject as PSO, PluginStateObject } from 'mol-plugin/state/objects';
import { AnimateModelIndex } from 'mol-plugin/state/animation/built-in';
import {StateBuilder, StateObject} from 'mol-state';
import { EvolutionaryConservation } from './annotation';
import { LoadParams, SupportedFormats, RepresentationStyle, ModelInfo } from './helpers';
import { RxEventHelper } from 'mol-util/rx-event-helper';
import { ControlsWrapper } from './ui/controls';
import { PluginState } from 'mol-plugin/state';
//import { Canvas3D } from 'mol-canvas3d/canvas3d';
import { OrderedSet } from 'mol-data/int';
import { ShapeGroup } from 'mol-model/shape';

export interface ColorParams {
    colorMode: string
}

class MolStarPLYWrapper {


    static VERSION_MAJOR = 2;
    static VERSION_MINOR = 0;

    private _ev = RxEventHelper.create();

    readonly events = {
        modelInfo: this._ev<ModelInfo>(),
        residueInfo: this._ev<{ residueNumber: number, residueName: string, chainName: string }>()
    };


    plugin: PluginContext;

    init(target: string | HTMLElement) {
        this.plugin = createPlugin(typeof target === 'string' ? document.getElementById(target)! : target, {
            ...DefaultPluginSpec,
            layout: {
                initial: {
                    isExpanded: false,
                    showControls: false
                },
                controls: {
                    right: ControlsWrapper
                }
            }
        });

        this.plugin.structureRepresentation.themeCtx.colorThemeRegistry.add(EvolutionaryConservation.Descriptor.name, EvolutionaryConservation.colorTheme!);
        this.plugin.lociLabels.addProvider(EvolutionaryConservation.labelProvider);
        this.plugin.customModelProperties.register(EvolutionaryConservation.propertyProvider);
    }

    get initClick() {
        this.plugin.canvas3d.interaction.click.subscribe(e => {
            const loci = e.current.loci;
            if (!ShapeGroup.isLoci(loci)) return // ignore non-shape loci
            const atomID = OrderedSet.toArray(loci.groups[0].ids)[0]; // takes the first id of the first group

            // use the model to related the atomID because the atomID is best viewed as a model property and
            // not as a structure property (a structure can be build from multiple models)
            const model = this.getObj<PluginStateObject.Molecule.Model>('model');
            if (!model) return // handle missing model case

            // assume the atomID is an index starting from 1
            const atomIndex = atomID - 1

            // get indices
            const residueIndex = model.atomicHierarchy.residueAtomSegments.index[atomIndex]
            const chainIndex = model.atomicHierarchy.chainAtomSegments.index[residueIndex]

            // get infos
            const residueNumber = model.atomicHierarchy.residues.auth_seq_id.value(residueIndex)
            const residueName = model.atomicHierarchy.residues.auth_comp_id.value(residueIndex)
            const chainName = model.atomicHierarchy.chains.auth_asym_id.value(chainIndex)
            aminoAcid = residueNumber;
            this.events.residueInfo.next({ residueNumber, residueName, chainName })
        });
        return 0;
    }

    get state() {
        return this.plugin.state.dataState;
    }

    private download(b: StateBuilder.To<PSO.Root>, url: string) {
        return b.apply(StateTransforms.Data.Download, { url, isBinary: false })
    }

    private model(b: StateBuilder.To<PSO.Data.Binary | PSO.Data.String>, format: SupportedFormats, assemblyId: string) {
        const parsed = format === 'cif'
            ? b.apply(StateTransforms.Data.ParseCif).apply(StateTransforms.Model.TrajectoryFromMmCif)
            : b.apply(StateTransforms.Model.TrajectoryFromPDB);
        return parsed
            .apply(StateTransforms.Model.ModelFromTrajectory, { modelIndex: 0 }, { ref: 'model' });
    }

    private plyData(b: StateBuilder.To<PSO.Data.String>) {
        return b.apply(StateTransforms.Data.ParsePly)
            .apply(StateTransforms.Model.ShapeFromPly)
            .apply(StateTransforms.Representation.ShapeRepresentation3D);
    }


    private ColorParams: ColorParams = { colorMode: ''};
    changeColor({ colorMode }: ColorParams) {
        console.log('colorMode:',colorMode);
        const tree = this.visual('asm');

       let red, green, blue  = '0';
       if (colorMode === 'element'){
           red = 'red';   green = 'green'; blue ='blue';
       }
       else if (colorMode === 'contactcount'){
           red = 'contactcount_r';   green = 'contactcount_g'; blue ='contactcount_b';
       }
       else if (colorMode === 'contactsteps'){
           red = 'contactsteps_r';   green = 'contactsteps_g'; blue ='contactsteps_b';
       }
       else if (colorMode === 'hbounds' ){
           red = 'hbounds_r';   green = 'hbounds_g'; blue ='hbounds_b';
       }
        else if (colorMode === 'hboundsteps'){
           red = 'hboundsteps_r';   green = 'hboundsteps_g'; blue ='hboundsteps_b';
       }
       else if (colorMode === 'spots'){
           red = 'spots_r';   green = 'spots_g'; blue ='spots_b';
       }
       else if (colorMode === 'rmsf'){
           red = 'rmsf_r';   green = 'rmsf_g'; blue ='rmsf_b';
       }
       console.log('color channels: ', red, green, blue);

        if (!tree) return;
        let state = this.state;
        PluginCommands.State.Update.dispatch(this.plugin, { state, tree })
    }

    private structure(assemblyId: string) {
        const model = this.state.build().to('model');

        return model
            .apply(StateTransforms.Model.CustomModelProperties, { properties: [EvolutionaryConservation.Descriptor.name] }, { ref: 'props', props: { isGhost: false } })
            .apply(StateTransforms.Model.StructureAssemblyFromModel, { id: assemblyId || 'deposited' }, { ref: 'asm' });
    }

    private visual(ref: string, style?: RepresentationStyle) {
        const structure = this.getObj<PluginStateObject.Molecule.Structure>(ref);

        if (!structure){
            return;
        }else{
            number_of_atoms = structure.units[0].elements.length;  // global variable in index.html
        }

        const root = this.state.build().to(ref);

        root.apply(StateTransforms.Model.StructureComplexElement, { type: 'atomic-sequence' }, { ref: 'sequence' })
            .apply(StateTransforms.Representation.StructureRepresentation3D,
                StructureRepresentation3DHelpers.getDefaultParamsWithTheme(this.plugin,
                    (style && style.sequence && style.sequence.kind) || 'cartoon',
                    (style && style.sequence && style.sequence.coloring) || 'unit-index', structure),
                    { ref: 'sequence-visual' });
        root.apply(StateTransforms.Model.StructureComplexElement, { type: 'atomic-het' }, { ref: 'het' })
            .apply(StateTransforms.Representation.StructureRepresentation3D,
                StructureRepresentation3DHelpers.getDefaultParamsWithTheme(this.plugin,
                    (style && style.hetGroups && style.hetGroups.kind) || 'ball-and-stick',
                    (style && style.hetGroups && style.hetGroups.coloring), structure),
                    { ref: 'het-visual' });
        root.apply(StateTransforms.Model.StructureComplexElement, { type: 'water' }, { ref: 'water' })
            .apply(StateTransforms.Representation.StructureRepresentation3D,
                StructureRepresentation3DHelpers.getDefaultParamsWithTheme(this.plugin,
                    (style && style.water && style.water.kind) || 'ball-and-stick',
                    (style && style.water && style.water.coloring), structure, { alpha: 0.51 }),
                    { ref: 'water-visual' });

        return root;
    }

    private getObj<T extends StateObject>(ref: string): T['data'] {
        const state = this.state;
        const cell = state.select(ref)[0];
        if (!cell || !cell.obj) return void 0;
        return (cell.obj as T).data;
    }

    private async doInfo(checkPreferredAssembly: boolean) {
        const model = this.getObj<PluginStateObject.Molecule.Model>('model');
        if (!model) return;

        const info = await ModelInfo.get(this.plugin, model, checkPreferredAssembly)
        this.events.modelInfo.next(info);
        return info;
    }

    private applyState(tree: StateBuilder) {
        return PluginCommands.State.Update.dispatch(this.plugin, { state: this.plugin.state.dataState, tree });
    }

    private loadedParams: LoadParams = { plyurl: '',  url: '', format: 'cif', assemblyId: '' };
    async load({ plyurl, url, format = 'cif', assemblyId = '', representationStyle }: LoadParams) {
        let loadType: 'full' | 'update' = 'full';

        const state = this.plugin.state.dataState;

        if (this.loadedParams.plyurl !== plyurl || this.loadedParams.url !== url || this.loadedParams.format !== format) {
            loadType = 'full';
        } else if (this.loadedParams.url === url) {
            if (state.select('asm').length > 0) loadType = 'update';
        }

        if (loadType === 'full') {
            await PluginCommands.State.RemoveObject.dispatch(this.plugin, { state, ref: state.tree.root.ref });
            // pdb/cif loading
            const modelTree = this.model(this.download(state.build().toRoot(), url), format, assemblyId);
            await this.applyState(modelTree);
            const info = await this.doInfo(true);
            const structureTree = this.structure((assemblyId === 'preferred' && info && info.preferredAssemblyId) || assemblyId);
            await this.applyState(structureTree);
            // ply loading
            const modelTreePly = this.plyData(this.download(state.build().toRoot(), plyurl));
            await this.applyState(modelTreePly);
        } else {
            const tree = state.build();
            tree.to('asm').update(StateTransforms.Model.StructureAssemblyFromModel, p => ({ ...p, id: assemblyId || 'deposited' }));
            await this.applyState(tree);
        }

        await this.updateStyle(representationStyle);

        this.loadedParams = { plyurl, url, format, assemblyId };
        PluginCommands.Camera.Reset.dispatch(this.plugin, { });
    }

    async updateStyle(style?: RepresentationStyle) {
        const tree = this.visual('asm', style);
        if (!tree) return;
        await PluginCommands.State.Update.dispatch(this.plugin, { state: this.plugin.state.dataState, tree });
    }

    setBackground(color: number) {
        PluginCommands.Canvas3D.SetSettings.dispatch(this.plugin, { settings: { backgroundColor: Color(color) } });
    }

    toggleSpin() {
        const trackball = this.plugin.canvas3d.props.trackball;
        const spinning = trackball.spin;
        PluginCommands.Canvas3D.SetSettings.dispatch(this.plugin, { settings: { trackball: { ...trackball, spin: !trackball.spin } } });
        if (!spinning) PluginCommands.Camera.Reset.dispatch(this.plugin, { });
    }

    animate = {
        modelIndex: {
            maxFPS: 8,
            onceForward: () => { this.plugin.state.animation.play(AnimateModelIndex, { maxFPS: Math.max(0.5, this.animate.modelIndex.maxFPS | 0), mode: { name: 'once', params: { direction: 'forward' } } }) },
            onceBackward: () => { this.plugin.state.animation.play(AnimateModelIndex, { maxFPS: Math.max(0.5, this.animate.modelIndex.maxFPS | 0), mode: { name: 'once', params: { direction: 'backward' } } }) },
            palindrome: () => { this.plugin.state.animation.play(AnimateModelIndex, { maxFPS: Math.max(0.5, this.animate.modelIndex.maxFPS | 0), mode: { name: 'palindrome', params: {} } }) },
            loop: () => { this.plugin.state.animation.play(AnimateModelIndex, { maxFPS: Math.max(0.5, this.animate.modelIndex.maxFPS | 0), mode: { name: 'loop', params: {} } }) },
            stop: () => this.plugin.state.animation.stop()
        }
    }

    coloring = {
        evolutionaryConservation: async () => {
            await this.updateStyle({ sequence: { kind: 'spacefill' } });

            const state = this.state;

            // const visuals = state.selectQ(q => q.ofType(PluginStateObject.Molecule.Structure.Representation3D).filter(c => c.transform.transformer === StateTransforms.Representation.StructureRepresentation3D));
            const tree = state.build();
            const colorTheme = { name: EvolutionaryConservation.Descriptor.name, params: this.plugin.structureRepresentation.themeCtx.colorThemeRegistry.get(EvolutionaryConservation.Descriptor.name).defaultValues };

            tree.to('sequence-visual').update(StateTransforms.Representation.StructureRepresentation3D, old => ({ ...old, colorTheme }));
            // for (const v of visuals) {
            // }

            await PluginCommands.State.Update.dispatch(this.plugin, { state, tree });
        }
    }

    snapshot = {
        get: () => {
            return this.plugin.state.getSnapshot();
        },
        set: (snapshot: PluginState.Snapshot) => {
            return this.plugin.state.setSnapshot(snapshot);
        },
        download: async (url: string) => {
            try {
                const data = await this.plugin.runTask(this.plugin.fetch({ url }));
                const snapshot = JSON.parse(data);
                await this.plugin.state.setSnapshot(snapshot);
            } catch (e) {
                console.log(e);
            }
        }

    }
}

(window as any).MolStarPLYWrapper = MolStarPLYWrapper;
