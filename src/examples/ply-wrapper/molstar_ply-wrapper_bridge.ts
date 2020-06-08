/**
 * Copyright (c) 2019 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */
import './ply-wrapper.scss';
import { createPlugin, DefaultPluginSpec } from '../../mol-plugin';
import './index.html';
import { PluginContext } from '../../mol-plugin/context';
import { PluginCommands } from '../../mol-plugin/commands';
import { StateTransforms } from '../../mol-plugin-state/transforms';
import { createStructureRepresentationParams } from '../../mol-plugin-state/helpers/structure-representation-params';
import { Color } from '../../mol-util/color';
import { PluginStateObject as PSO, PluginStateObject } from '../../mol-plugin-state/objects';
import { AnimateModelIndex } from '../../mol-plugin-state/animation/built-in';
import {StateBuilder, StateObject} from '../../mol-state';
import { EvolutionaryConservation } from '../proteopedia-wrapper/annotation';
import { LoadParams, SupportedFormats, RepresentationStyle, ModelInfo } from './helpers';
import { RxEventHelper } from '../../mol-util/rx-event-helper';
//import { ControlsWrapper } from './ui/controls';
import { PluginState } from '../../mol-plugin/state';
//import { Canvas3D } from '../../mol-canvas3d/canvas3d';
import { OrderedSet } from '../../mol-data/int';
import {ShapeGroup} from '../../mol-model/shape';
import {MarkerAction} from '../../mol-util/marker-action';
import {StateElements} from '../proteopedia-wrapper/helpers';
//import {volumeStreamingControls} from "../proteopedia-wrapper/ui/controls";
let ex = require('./data_exchange');



export interface ColorParams {
    colorMode: string,
    plyurl: string,
    url: string,
    format: "pdb",
    assemblyId: string
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
                }
            },

        });// ControlsWrapper(this.plugin, parent);
        this.plugin.representation.structure.themes.colorThemeRegistry.add(EvolutionaryConservation.colorThemeProvider!);
        this.plugin.managers.lociLabels.addProvider(EvolutionaryConservation.labelProvider!);
        this.plugin.customModelProperties.register(EvolutionaryConservation.propertyProvider, true);
    }

    changeMark(old_ami: number){
        const model = this.getObj<PluginStateObject.Molecule.Model>('model');
        let test_aminoacid = 0;
        console.log("old_ami",old_ami);
        if(ex.mesh_object_e !== 0) {
            for (let i = 1; i <= ex.number_of_atoms; i++) {
                test_aminoacid = model.atomicHierarchy.residues.auth_seq_id.value(model.atomicHierarchy.residueAtomSegments.index[i]);
                if (test_aminoacid === ex.aminoAcid) {
                    if (!this.plugin.canvas3d) {return;}
                    this.plugin.canvas3d.mark({
                        repr: ex.mesh_object_e.current.repr,
                        loci: ShapeGroup.Loci(ex.mesh_object_e.current.loci.shape, [{
                            ids: OrderedSet.ofSingleton(i),
                            instance: 0
                        }])
                    }, MarkerAction.Highlight)
                } else if(test_aminoacid === old_ami) {
                    if (!this.plugin.canvas3d) {return};
                    this.plugin.canvas3d.mark({
                        repr: ex.mesh_object_e.current.repr,
                        loci: ShapeGroup.Loci(ex.mesh_object_e.current.loci.shape, [{ids: OrderedSet.ofSingleton(i), instance: 0}])
                    }, MarkerAction.RemoveHighlight)
                }
            }
        }
        return 0;
    }
    get initClick() {
        if (!this.plugin.canvas3d) {return};
        this.plugin.canvas3d.interaction.click.subscribe(e => {
            const loci = e.current.loci;
            console.log("e:",e);
            console.log("e.currnet", e.current.repr?.getLoci());
            console.log("loci-test:",loci);
            ex.mesh_object_e = e;
            if (!ShapeGroup.isLoci(loci)) return; // ignore non-shape loci
            const atomID = OrderedSet.toArray(loci.groups[0].ids)[0]; // takes the first id of the first group
            console.log("atomID:",atomID);
            // use the model to related the atomID because the atomID is best viewed as a model property and
            // not as a structure property (a structure can be build from multiple models)
            const model = this.getObj<PluginStateObject.Molecule.Model>('model');

            if (!model) return; // handle missing model case

            // assume the atomID is an index starting from 1
            const atomIndex = atomID - 1;

            // get indices
            const residueIndex = model.atomicHierarchy.residueAtomSegments.index[atomIndex];
            const chainIndex = model.atomicHierarchy.chainAtomSegments.index[residueIndex];
            console.log("model: ",model);
            // get infos
            const residueNumber = model.atomicHierarchy.residues.auth_seq_id.value(residueIndex);
            const residueName = model.atomicHierarchy.atoms.auth_comp_id.value(residueIndex);
            const chainName = model.atomicHierarchy.chains.auth_asym_id.value(chainIndex);

            //console.log("residueIndex",residueIndex);
            //console.log("chainIndex",chainIndex);
            //console.log("residueNumber",residueNumber);
            //console.log("residueName",residueName);
            //console.log("chainName",chainName);
            ex.aminoAcid = residueNumber;
            this.events.residueInfo.next({residueNumber, residueName, chainName});

        });
        return 0;
    }

    get state() {
        return this.plugin.state.data;
    }

    private download(b: StateBuilder.To<PSO.Root>, url: string) {
        console.log("download():  url:",url);
        return b.apply(StateTransforms.Data.Download, { url, isBinary: false });
    }

    private model(b: StateBuilder.To<PSO.Data.Binary | PSO.Data.String>, format: SupportedFormats, assemblyId: string) {
        const parsed = format === 'cif'
            ? b.apply(StateTransforms.Data.ParseCif).apply(StateTransforms.Model.TrajectoryFromMmCif)
            : b.apply(StateTransforms.Model.TrajectoryFromPDB);
        return parsed
            .apply(StateTransforms.Model.ModelFromTrajectory, { modelIndex: 0 }, { ref: 'model' });
    }

    private plyData(b: StateBuilder.To<PSO.Data.Binary | PSO.Data.String>) {
        return b.apply(StateTransforms.Data.ParsePly)
            .apply(StateTransforms.Model.ShapeFromPly)
            .apply(StateTransforms.Representation.ShapeRepresentation3D);

    }


    private ColorParams: ColorParams = { colorMode: '', plyurl: '',  url: '', format: 'pdb', assemblyId: ''};
    changeColor({ colorMode, plyurl, url, format, assemblyId }: ColorParams) {
        this.load({ plyurl: plyurl, url: url, format: format})
        console.log('colorMode:', colorMode, this.ColorParams);
        const tree = this.visual('asm');
        let red, green, blue  = '0';
        if (colorMode === 'element') {
            red = 'red';
            green = 'green';
            blue = 'blue';
        } else if (colorMode === 'contactcount'){
            red = 'contactcount_r';
            green = 'contactcount_g';
            blue = 'contactcount_b';
       } else if (colorMode === 'contactsteps'){
           red = 'contactsteps_r';   green = 'contactsteps_g'; blue ='contactsteps_b';
       } else if (colorMode === 'hbonds' ){
           red = 'hbonds_r';   green = 'hbonds_g'; blue = 'hbonds_b';
       }
        else if (colorMode === 'hbondsteps'){
           red = 'hbondsteps_r';   green = 'hbondsteps_g'; blue = 'hbondsteps_b';
       }
       else if (colorMode === 'molcount'){
           red = 'molcount_r';   green = 'molcount_g'; blue = 'molcount_b';
       }
       else if (colorMode === 'spots'){
           red = 'spots_r';   green = 'spots_g'; blue = 'spots_b';
       }
       else if (colorMode === 'rmsf'){
           red = 'rmsf_r';   green = 'rmsf_g'; blue = 'rmsf_b';
       }
        ex.colorMode_r = red;
        ex.colorMode_g = green;
        ex.colorMode_b = blue;
        console.log(red, green, blue)
        if (!tree) return;
        let state = this.state;
        PluginCommands.State.Update(this.plugin, { state, tree })
    }

    private structure(assemblyId: string) {
        const model = this.state.build().to(StateElements.Model);
        const props = {
            type: assemblyId ? {
                name: 'assembly' as const,
                params: { id: assemblyId }
            } : {
                name: 'model' as const,
                params: { }
            }
        };

        const s = model
            .apply(StateTransforms.Model.StructureFromModel, props, { ref: StateElements.Assembly });

        s.apply(StateTransforms.Model.StructureComplexElement, { type: 'atomic-sequence' }, { ref: StateElements.Sequence });
        s.apply(StateTransforms.Model.StructureComplexElement, { type: 'atomic-het' }, { ref: StateElements.Het });
        s.apply(StateTransforms.Model.StructureComplexElement, { type: 'water' }, { ref: StateElements.Water });

        return s;
    }

    private visual(ref: string, style?: RepresentationStyle) {
        const structure = this.getObj<PluginStateObject.Molecule.Structure>(ref);
        if (!structure){
            return;
        }else{
            ex.number_of_atoms = structure.units[0].elements.length;    // global variable in index.html
        }

        const root = this.state.build().to(ref);

        root.apply(StateTransforms.Model.StructureComplexElement, { type: 'atomic-sequence' }, { ref: 'sequence' })
            .apply(StateTransforms.Representation.StructureRepresentation3D,
                createStructureRepresentationParams(this.plugin, structure, {
                    type: (style && style.sequence && style.sequence.kind) || 'cartoon',
                    color: (style && style.sequence && style.sequence.coloring) || 'unit-index'}), { ref: 'sequence-visual' });
        root.apply(StateTransforms.Model.StructureComplexElement, { type: 'atomic-het' }, { ref: 'het' })
            .apply(StateTransforms.Representation.StructureRepresentation3D,
                createStructureRepresentationParams(this.plugin, structure, {
                    type: (style && style.hetGroups && style.hetGroups.kind) || 'ball-and-stick',
                    color: (style && style.hetGroups && style.hetGroups.coloring)}), { ref: 'het-visual' });
        root.apply(StateTransforms.Model.StructureComplexElement, { type: 'water' }, { ref: 'water' })
            .apply(StateTransforms.Representation.StructureRepresentation3D,
                createStructureRepresentationParams(this.plugin, structure, {
                    type: (style && style.water && style.water.kind) || 'ball-and-stick',
                    color: (style && style.water && style.water.coloring),
                    typeParams: { alpha: 0.51 }}), { ref: 'water-visual' });

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
        return PluginCommands.State.Update(this.plugin, { state: this.plugin.state.data, tree });
    }

    private loadedParams: LoadParams = { plyurl: '',  url: '', format: 'cif', assemblyId: '' };
    async load({ plyurl, url, format = 'cif', assemblyId = '', representationStyle }: LoadParams) {
        let loadType: 'full' | 'update' = 'full';
        console.log("async load():  url:",url);
        const state = this.plugin.state.data;

        if (this.loadedParams.plyurl !== plyurl || this.loadedParams.url !== url || this.loadedParams.format !== format) {
            loadType = 'full';
        } else if (this.loadedParams.url === url) {
            if (state.select('asm').length > 0) loadType = 'update';
        }
        loadType = 'full';

        if (loadType === 'full') {
            await PluginCommands.State.RemoveObject(this.plugin, { state, ref: state.tree.root.ref });
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
            tree.to('asm').update(StateTransforms.Model.StructureFromModel, p => ({ ...p, id: assemblyId || 'deposited' }));
            await this.applyState(tree);
        }

        await this.updateStyle(representationStyle);

        this.loadedParams = { plyurl, url, format, assemblyId };
        PluginCommands.Camera.Reset(this.plugin, { });
    }

    async updateStyle(style?: RepresentationStyle) {
        const tree = this.visual('asm', style);
        if (!tree) return;
        await PluginCommands.State.Update(this.plugin, { state: this.plugin.state.data, tree });
    }

    setBackground(color: number) {
        if (!this.plugin.canvas3d) return;
        const renderer = this.plugin.canvas3d.props.renderer;
        PluginCommands.Canvas3D.SetSettings(this.plugin, { settings: { renderer: { ...renderer,  backgroundColor: Color(color) } } });
    }

    toggleSpin() {
        if (!this.plugin.canvas3d) {return};
        console.log(ex.aminoAcid);
        const trackball = this.plugin.canvas3d.props.trackball;
        const spinning = trackball.spin;
        PluginCommands.Canvas3D.SetSettings(this.plugin, { settings: { trackball: { ...trackball, spin: !trackball.spin } } });
        if (!spinning) PluginCommands.Camera.Reset(this.plugin, { });
    }

    animate = {
        modelIndex: {
            maxFPS: 8,
            onceForward: () => { this.plugin.managers.animation.play(AnimateModelIndex, { maxFPS: Math.max(0.5, this.animate.modelIndex.maxFPS | 0), mode: { name: 'once', params: { direction: 'forward' } } }) },
            onceBackward: () => { this.plugin.managers.animation.play(AnimateModelIndex, { maxFPS: Math.max(0.5, this.animate.modelIndex.maxFPS | 0), mode: { name: 'once', params: { direction: 'backward' } } }) },
            palindrome: () => { this.plugin.managers.animation.play(AnimateModelIndex, { maxFPS: Math.max(0.5, this.animate.modelIndex.maxFPS | 0), mode: { name: 'palindrome', params: {} } }) },
            loop: () => { this.plugin.managers.animation.play(AnimateModelIndex, { maxFPS: Math.max(0.5, this.animate.modelIndex.maxFPS | 0), mode: { name: 'loop', params: {} } }) },
            stop: () => this.plugin.managers.animation.stop()
        }
    }

    coloring = {
        evolutionaryConservation: async (params?: { sequence?: boolean, het?: boolean, keepStyle?: boolean }) => {
            if (!params || !params.keepStyle) {
                await this.updateStyle({ sequence: { kind: 'spacefill' } });
            }

            const state = this.state;
            const tree = state.build();
            const colorTheme = { name: EvolutionaryConservation.propertyProvider.descriptor.name, params: this.plugin.representation.structure.themes.colorThemeRegistry.get(EvolutionaryConservation.propertyProvider.descriptor.name).defaultValues };

            if (!params || !!params.sequence) {
                tree.to(StateElements.SequenceVisual).update(StateTransforms.Representation.StructureRepresentation3D, old => ({ ...old, colorTheme }));
            }
            if (params && !!params.het) {
                tree.to(StateElements.HetVisual).update(StateTransforms.Representation.StructureRepresentation3D, old => ({ ...old, colorTheme }));
            }

            await PluginCommands.State.Update(this.plugin, { state, tree });
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
