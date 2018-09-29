import {
	ClientCapabilities,
	DidChangeConfigurationParams,
	InitializeParams,
	TextDocument
} from 'vscode-languageserver';

import { pb } from './pbAPI';

export namespace pbSettings {
	export let initParams: InitializeParams;
	export let clientCapabilities: ClientCapabilities;
	export let hasWorkspaceConfigCapability: boolean = false;
	export let hasWorkspaceFolderCapability: boolean = false;
	export let hasDiagnosticRelatedInformationCapability: boolean = false;

	/**
	 * All Purebasic settings customized by user
	 */
	export interface IDocumentSettings {
		diagnostics: {
			maxNumberOfProblems: number;
		};
	}
	const DEFAULT_SETTINGS: IDocumentSettings = {
		diagnostics: {
			maxNumberOfProblems: 1000
		}
	};
	/**
	 * The global settings, used when the `workspace/configuration` request is not supported by the client.
	 * Please note that this is not the case when using this server with the client provided in this example
	 * but could happen with other clients.
	 */
	let globalSettings: IDocumentSettings = DEFAULT_SETTINGS;
	/**
	 * Cache the settings of all open documents
	 */
	let documentSettings: Map<string, Thenable<IDocumentSettings>> = new Map();

	export function initialize(params: InitializeParams) {
		initParams = params;
		clientCapabilities = initParams.capabilities;
		// Does the client support the `workspace/configuration` request?
		// If not, we will fall back using global settings
		hasWorkspaceConfigCapability = !!(clientCapabilities.workspace && clientCapabilities.workspace.configuration);
		hasWorkspaceFolderCapability = !!(clientCapabilities.workspace && clientCapabilities.workspace.workspaceFolders);
		hasDiagnosticRelatedInformationCapability = !!(clientCapabilities.textDocument && clientCapabilities.textDocument.publishDiagnostics && clientCapabilities.textDocument.publishDiagnostics.relatedInformation);
	}

	export function change(params: DidChangeConfigurationParams) {
		if (!hasWorkspaceConfigCapability) {
			globalSettings = <IDocumentSettings>(params.settings.purebasicLanguage || DEFAULT_SETTINGS);
		} else {
			// Reset all cached document settings
			documentSettings.clear();
		}
	}

	export function load(doc: TextDocument): Thenable<IDocumentSettings> {
		if (!hasWorkspaceConfigCapability) {
			return Promise.resolve(globalSettings);
		}
		let docSettings = documentSettings.get(doc.uri);
		if (!docSettings) {
			docSettings = pb.connection.workspace.getConfiguration({ scopeUri: doc.uri, section: 'purebasicLanguage' });
			documentSettings.set(doc.uri, docSettings);
		}
		return docSettings;
	}

	export function remove(doc: TextDocument) {
		documentSettings.delete(doc.uri);
	}
}