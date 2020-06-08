// create an instance of the plugin
import * as $ from 'jquery';
import * as d3 from 'd3';
let ex = require('../ply-wrapper/data_exchange');
import {iniciar} from '../../FProject5.3/scriptv2';
console.log($.version);
var PluginWrapper = new MolStarPLYWrapper();

console.log('Wrapper version', MolStarPLYWrapper.VERSION_MAJOR);

function $(id) { return document.getElementById(id); }

ex.aminoAcid = 91;
ex.number_of_atoms = 0;
ex.mesh_object_e = 0;
var assemblyId = 'preferred';
var plyurl = '/test-data/run_0_mesh.ply';
var url = '/test-data/run_0.pdb';
var format = 'pdb';
var plyName = 'run_0_mesh';
//var plyurl = '/test-data/' + plyName + '.ply';
var colorMode = 'element';

PluginWrapper.init('app' /** or document.getElementById('app') */);
PluginWrapper.setBackground(0xffffff);
PluginWrapper.load({ plyurl: plyurl, url: url, format: format, assemblyId: assemblyId });
PluginWrapper.toggleSpin();

PluginWrapper.events.modelInfo.subscribe(function (info) {
    console.log('Model Info', info);
});

/*
PluginWrapper.events.residueInfo.subscribe(function (info) {
    console.log(`Clicked: [${info.residueName}]${info.residueNumber}:${info.chainName}`)
});
*/

// addControl('Load ', () => PluginWrapper.load({ plyurl: plyurl, url: url, format: format }));
//addControl('Load Assembly', () => PluginWrapper.load({ plyurl: plyurl, url: url, format: format, assemblyId: assemblyId }));
//import './FProject5.3/data';
//addSeparator();
document.write("<div id='controls'>");
addHeader('Dataset');
document.write("<select id='select'>\n" +
    "            <option selected='selected' value='./FProject5.3/data/run_0.json'>Run 0 </option>\n" +
    "            <option value='./FProject5.3/data/run_1.json'>Run 1 </option>\n" +
    "            <option value='./FProject5.3/data/run_2.json'>Run 2</option>\n" +
    "            <option value='./FProject5.3/data/run_3.json'>Run 3</option>\n" +
    "            <option value='./FProject5.3/data/run_4.json'>Run 4</option>\n" +
    "            <option value='./FProject5.3/data/run_5.json'>Run 5</option>\n" +
    "            <option value='./FProject5.3/data/run_6.json'>Run 6</option>\n" +
    "            <option value='./FProject5.3/data/run_7.json'>Run 7</option>\n" +
    "            <option value='./FProject5.3/data/run_8.json'>Run 8</option>\n" +
    "            <option value='./FProject5.3/data/run_9.json'>Run 9</option>\n" +
    "            <option value='./FProject5.3/data/run_total.json'>Run total</option>\n" +
    "            <option value='./FProject5.3/data/PS_273_ZINC000008101192fda_accum.json'>PS_273</option>\n" +
    "            <option value='./FProject5.3/data/PS_563_ZINC000060184549fda_accum.json'>PS_563</option>\n" +
    "            <option value='./FProject5.3/data/PS_564_ZINC000060184552fda_accum.json'>PS_564</option>\n" +
    "            <option value='./FProject5.3/data/PS_565_ZINC000060184554fda_accum.json'>PS_565</option>\n" +
    "            <option value='./FProject5.3/data/PS_566_ZINC000060184556fda_accum.json'>PS_566</option>\n" +
    "            <option value='./FProject5.3/data/PS_1043_ZINC000008101115fda_accum.json'>PS_1043</option>\n" +
    "            <option value='./FProject5.3/data/PS_1044_ZINC000008101116fda_accum.json'>PS_1044</option>\n" +
    "            <option value='./FProject5.3/data/PS_1045_ZINC000008101117fda_accum.json'>PS_1045</option>\n" +
    "            <option value='./FProject5.3/data/PS_2363_ZINC000242437514fda_accum.json'>PS_2363</option>\n" +
    "            <option value='./FProject5.3/data/PS_2973_ZINC000022443609fda_accum.json'>PS_2973</option>\n" +
    "            <option value='./FProject5.3/data/SDH_747_ZINC000033975089fda_accum.json'>SDH_747</option>\n" +
    "            <option value='./FProject5.3/data/SDH_805_ZINC000100218367fda_accum.json'>SDH_805</option>\n" +
    "            <option value='./FProject5.3/data/SDH_905_ZINC000003830773fda_accum.json'>SDH_905</option>\n" +
    "            <option value='./FProject5.3/data/SDH_1778_ZINC000004629876fda_accum.json'>SDH_1778</option>\n" +
    "            <option value='./FProject5.3/data/SDH_2418_ZINC000169289411fda_accum.json'>SDH_2418</option>\n" +
    "            <option value='./FProject5.3/data/SDH_2451_ZINC000013911941fda_accum.json'>SDH_2451</option>\n" +
    "            <option value='./FProject5.3/data/SDH_2683_ZINC000003914809fda_accum.json'>SDH_2683</option>\n" +
    "            <option value='./FProject5.3/data/SDH_2685_ZINC000169677008fda_accum.json'>SDH_2685</option>\n" +
    "            <option value='./FProject5.3/data/SDH_2796_ZINC000169621228fda_accum.json'>SDH_2796</option>\n" +
    "            <option value='./FProject5.3/data/SDH_2906_ZINC000004641374fda_accum.json'>SDH_2906</option>\n" +
    "        </select>");
document.getElementById('select').onchange = function() { iniciar(); setPDB_and_Mesh();};
addSeparator();
addHeader('Camera');
addControl('Toggle Spin', () => PluginWrapper.toggleSpin());
addSeparator();
addHeader('Color Mode');
document.write(" <select id='colorMode' onchange='PluginWrapper.changeColor({ colorMode: colorMode, plyurl: plyurl, url: url, format: format })' > " +
    "<option value='element' selected>Element</option> " +
    "<option value='contactcount'>ContactCount</option> " +
    "<option value='contactsteps'>ContactSteps</option>" +
    " <option value='hbonds'>Hbonds</option> " +
    " <option value='hbondsteps'>HbondsSteps</option> " +
    " <option value='molcount'>ContactMolecules</option> " +
    "<option value='spots'>LandingSpots</option>  " +
    "<option value='rmsf'>RMSF</option>  </select>");
addControl('apply ', () => PluginWrapper.changeColor({ colorMode: colorMode, plyurl: plyurl, url: url, format: format }));
$('colorMode').onchange = function (e) { colorMode = e.target.value; }

document.write("</div>");
PluginWrapper.initClick;

// addHeader('Animation');

// adjust this number to make the animation faster or slower
// requires to "restart" the animation if changed
// PluginWrapper.animate.modelIndex.maxFPS = 30;

//addControl('Play To End', () => PluginWrapper.animate.modelIndex.onceForward());
//addControl('Play To Start', () => PluginWrapper.animate.modelIndex.onceBackward());
//addControl('Play Palindrome', () => PluginWrapper.animate.modelIndex.palindrome());
//addControl('Play Loop', () => PluginWrapper.animate.modelIndex.loop());
//addControl('Stop', () => PluginWrapper.animate.modelIndex.stop());

//addSeparator();
//addHeader('Misc');

//addControl('Apply Evo Cons', () => PluginWrapper.coloring.evolutionaryConservation());
//addControl('Default Visuals', () => PluginWrapper.updateStyle());

//addSeparator();
//addHeader('State');
/*
var snapshot;
addControl('Create Snapshot', () => {
    snapshot = PluginWrapper.snapshot.get();
    // could use JSON.stringify(snapshot) and upload the data
});
addControl('Apply Snapshot', () => {
    if (!snapshot) return;
    PluginWrapper.snapshot.set(snapshot);

    // or download snapshot using fetch or ajax or whatever
    // or PluginWrapper.snapshot.download(url);
});
*/
////////////////////////////////////////////////////////

function addControl(label, action) {
    var btn = document.createElement('button');
    btn.onclick = action;
    btn.innerText = label;
    $('controls').appendChild(btn);
}

function addSeparator() {
    var hr = document.createElement('hr');
    $('controls').appendChild(hr);
}

function addHeader(header) {
    var h = document.createElement('h3');
    h.innerText = header;
    $('controls').appendChild(h);
}
function setPDB_and_Mesh(){
    var json = document.getElementById('select').value;
    if (json == './FProject5.3/data/PS_273_ZINC000008101192fda_accum.json') {
        plyurl = '/test-data/PS_273_ZINC000008101192fda_mesh.ply';
        url = '/test-data/PS_273_ZINC000008101192fda_generated.pdb';
    } else if (json == './FProject5.3/data/PS_563_ZINC000060184549fda_accum.json') {
        plyurl = '/test-data/PS_563_ZINC000060184549fda_mesh.ply';
        url = '/test-data/PS_563_ZINC000060184549fda_generated.pdb';
    } else if (json == './FProject5.3/data/PS_564_ZINC000060184552fda_accum.json') {
        plyurl = '/test-data/PS_564_ZINC000060184552fda_mesh.ply';
        url = '/test-data/PS_564_ZINC000060184552fda_generated.pdb';
    } else if (json == './FProject5.3/data/PS_565_ZINC000060184554fda_accum.json') {
        plyurl = '/test-data/PS_565_ZINC000060184554fda_mesh.ply';
        url = '/test-data/PS_566_ZINC000060184556fda_generated.pdb';
    } else if (json == './FProject5.3/data/PS_566_ZINC000060184556fda_accum.json') {
        plyurl = '/test-data/PS_566_ZINC000060184556fda_mesh.ply';
        url = '/test-data/PS_566_ZINC000060184556fda_generated.pdb';
    } else if (json == './FProject5.3/data/PS_1043_ZINC000008101115fda_accum.json') {
        plyurl = '/test-data/PS_1043_ZINC000008101115fda_mesh.ply';
        url = '/test-data/PS_1043_ZINC000008101115fda_generated.pdb';
    } else if (json == './FProject5.3/data/PS_1044_ZINC000008101116fda_accum.json') {
        plyurl = '/test-data/PS_1044_ZINC000008101116fda_mesh.ply';
        url = '/test-data/PS_1044_ZINC000008101116fda_generated.pdb';
    } else if (json == './FProject5.3/data/PS_1045_ZINC000008101117fda_accum.json') {
        plyurl = '/test-data/PS_1045_ZINC000008101117fda_mesh.ply';
        url = '/test-data/PS_1045_ZINC000008101117fda_generated.pdb';
    } else if (json == './FProject5.3/data/PS_2363_ZINC000242437514fda_accum.json') {
        plyurl = '/test-data/PS_2363_ZINC000242437514fda_mesh.ply';
        url = '/test-data/PS_2363_ZINC000242437514fda_generated.pdb';
    } else if (json == './FProject5.3/data/PS_2973_ZINC000022443609fda_accum.json') {
        plyurl = '/test-data/PS_2973_ZINC000022443609fda_mesh.ply';
        url = '/test-data/PS_2973_ZINC000022443609fda_generated.pdb';
    } else if (json == './FProject5.3/data/SDH_747_ZINC000033975089fda_accum.json') {
        plyurl = '/test-data/SDH_747_ZINC000033975089fda_mesh.ply';
        url = '/test-data/SDH_747_ZINC000033975089fda_generated.pdb';
    }else if (json == './FProject5.3/data/SDH_805_ZINC000100218367fda_accum.json') {
        plyurl = '/test-data/SDH_805_ZINC000100218367fda_mesh.ply';
        url = '/test-data/SDH_805_ZINC000100218367fda_generated.pdb';
    }else if (json == './FProject5.3/data/SDH_905_ZINC000003830773fda_accum.json') {
        plyurl = '/test-data/SDH_905_ZINC000003830773fda_mesh.ply';
        url = '/test-data/SDH_905_ZINC000003830773fda_generated.pdb';
    }else if (json == './FProject5.3/data/SDH_1778_ZINC000004629876fda_accum.json') {
        plyurl = '/test-data/SDH_1778_ZINC000004629876fda_mesh.ply';
        url = '/test-data/SDH_1778_ZINC000004629876fda_generated.pdb';
    }else if (json == './FProject5.3/data/SDH_2418_ZINC000169289411fda_accum.json') {
        plyurl = '/test-data/SDH_2418_ZINC000169289411fda_mesh.ply';
        url = '/test-data/SDH_2418_ZINC000169289411fda_generated.pdb';
    }else if (json == './FProject5.3/data/SDH_2451_ZINC000013911941fda_accum.json') {
        plyurl = '/test-data/SDH_2451_ZINC000013911941fda_mesh.ply';
        url = '/test-data/SDH_2451_ZINC000013911941fda_generated.pdb';
    }else if (json == './FProject5.3/data/SDH_2683_ZINC000003914809fda_accum.json') {
        plyurl = '/test-data/SDH_2683_ZINC000003914809fda_mesh.ply';
        url = '/test-data/SDH_2683_ZINC000003914809fda_generated.pdb';
    }else if (json == './FProject5.3/data/SDH_2685_ZINC000169677008fda_accum.json') {
        plyurl = '/test-data/SDH_2685_ZINC000169677008fda_mesh.ply';
        url = '/test-data/SDH_2685_ZINC000169677008fda_generated.pdb';
    }else if (json == './FProject5.3/data/SDH_2796_ZINC000169621228fda_accum.json') {
        plyurl = '/test-data/SDH_2796_ZINC000169621228fda_mesh.ply';
        url = '/test-data/SDH_2796_ZINC000169621228fda_generated.pdb';
    }else if (json == './FProject5.3/data/SDH_2906_ZINC000004641374fda_accum.json') {
        plyurl = '/test-data/SDH_2906_ZINC000004641374fda_mesh.ply';
        url = '/test-data/SDH_2906_ZINC000004641374fda_generated.pdb';
    }else if (json == './FProject5.3/data/run_0.json') {
        plyurl = '/test-data/run_0_mesh.ply';
        url = '/test-data/run_0.pdb';
    }else if (json == './FProject5.3/data/run_1.json') {
        plyurl = '/test-data/run_1_mesh.ply';
        url = '/test-data/run_1.pdb';
    } else if (json == './FProject5.3/data/run_2.json') {
        plyurl = '/test-data/run_2_mesh.ply';
        url = '/test-data/run_2.pdb';
    } else if (json == './FProject5.3/data/run_3.json') {
        plyurl = '/test-data/run_3_mesh.ply';
        url = '/test-data/run_3.pdb';
    } else if (json == './FProject5.3/data/run_4.json') {
        plyurl = '/test-data/run_4_mesh.ply';
        url = '/test-data/run_4.pdb';
    } else if (json == './FProject5.3/data/run_5.json') {
        plyurl = '/test-data/run_5_mesh.ply';
        url = '/test-data/run_5.pdb';
    } else if (json == './FProject5.3/data/run_6.json') {
        plyurl = '/test-data/run_6_mesh.ply';
        url = '/test-data/run_6.pdb';
    } else if (json == './FProject5.3/data/run_7.json') {
        plyurl = '/test-data/run_7_mesh.ply';
        url = '/test-data/run_7.pdb';
    } else if (json == './FProject5.3/data/run_8.json') {
        plyurl = '/test-data/run_8_mesh.ply';
        url = '/test-data/run_8.pdb';
    } else if (json == './FProject5.3/data/run_9.json') {
        plyurl = '/test-data/run_9_mesh.ply';
        url = '/test-data/run_9.pdb';
    } else if (json == './FProject5.3/data/run_total.json') {
        plyurl = '/test-data/run_total_mesh.ply';
        url = '/test-data/run_total.pdb';
    }
    function $(id) { return document.getElementById(id); }
    PluginWrapper.load({ plyurl:  plyurl, url: url, format: format, assemblyId: assemblyId })
}

// check for change of aminoacid (per click on rectangular of seq-diagram)
var old_ami = 0;
d3.timer(function() {
    if(ex.aminoAcid !== old_ami){
        PluginWrapper.changeMark(old_ami);
        old_ami = ex.aminoAcid;
    }
})

