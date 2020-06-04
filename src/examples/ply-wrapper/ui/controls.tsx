/**
 * Copyright (c) 2019 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { PluginContextContainer } from '../../../mol-plugin-ui/plugin';
import { TransformUpdaterControl } from '../../../mol-plugin-ui/state/update-transform';
import { PluginContext } from '../../../mol-plugin/context';
import { StateElements } from '../../proteopedia-wrapper/helpers';

export function ControlsWrapper(plugin: PluginContext, parent: Element) {
    ReactDOM.render(<PluginContextContainer plugin={plugin}>
        <TransformUpdaterControl nodeRef={StateElements.VolumeStreaming} />
    </PluginContextContainer>, parent);
}