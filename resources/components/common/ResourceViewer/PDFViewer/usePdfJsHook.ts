import { useCallback, useEffect, useRef } from '@wordpress/element';
import * as pdfjs from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';
import * as pdfjsViewer from 'pdfjs-dist/web/pdf_viewer.mjs';
import type { RefObject } from 'react';

import { GlobalWorkerOptions } from 'pdfjs-dist';

if (typeof window !== 'undefined' && 'Worker' in window) {
	GlobalWorkerOptions.workerPort = new Worker(
		new URL(
			/* webpackChunkName: "pdfjs-worker" */ 'pdfjs-dist/build/pdf.worker.mjs',
			import.meta.url
		),
		{ type: 'module' }
	);
}

// PDF.js options
const assetsUrl =
	(document.currentScript as HTMLScriptElement | null)?.src ??
	window.location.href;
const CMAP_URL = new URL('pdfjs-cmaps/', assetsUrl).href;
const CMAP_PACKED = true;
const ENABLE_XFA = true;

const options = {
	cMapUrl: CMAP_URL,
	// cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
	cMapPacked: CMAP_PACKED,
	enableXfa: ENABLE_XFA,
};

// Type definitions
export type InitCallback = (data: { source: pdfjsViewer.PDFViewer }) => void;

export type PageChangeCallback = (data: {
	source: pdfjsViewer.PDFViewer;
	pageNumber: number;
	pageLabel: string | null;
	previous: number;
}) => void;

/**
 * PDFViewInternals.
 *
 * Class that contains internal PDF.js objects and permits adding event callbacks.
 */
class PDFViewInternals {
	eventBus: pdfjsViewer.EventBus;
	linkService: pdfjsViewer.PDFLinkService;
	viewer: pdfjsViewer.PDFViewer;
	docLoading: boolean = false;

	/**
	 * PDFViewInternals.
	 *
	 * Initializez the pdf.js viewer objects.
	 * @param container the div element that will be container for the pdf viewer
	 */
	constructor(container: HTMLDivElement) {
		this.eventBus = new pdfjsViewer.EventBus();
		this.linkService = new pdfjsViewer.PDFLinkService({
			eventBus: this.eventBus,
		});
		this.viewer = new pdfjsViewer.PDFViewer({
			container,
			eventBus: this.eventBus,
			linkService: this.linkService,
		});
		this.linkService.setViewer(this.viewer);
	}

	/**
	 * Add viewer event bus callback.
	 *
	 * @param eventName the name of the event
	 * @param callback  the function used as callback when event is fired
	 * @return this object for chaining
	 */
	on(eventName: string, callback: (data: any) => void) {
		this.eventBus.on(eventName, callback);
		return this;
	}
}

/**
 * usePdfJs hook.
 *
 * Handles the initialization of PDF.js viewer in the container div provided and
 * allows controlling viewer state.
 *
 * @param containerRef       reference to viewer container div
 * @param initCallback       callback when document is initialized
 * @param pageChangeCallback callback when current page changes
 * @return loadDocument, setCurrentPage and setScale actions
 */
const usePdfJs = (
	containerRef: RefObject<HTMLDivElement>,
	initCallback: InitCallback,
	pageChangeCallback: PageChangeCallback
) => {
	const pdfInternals = useRef<PDFViewInternals>();

	// Initialize PDF.js internals and hook data change callbacks
	useEffect(() => {
		if (containerRef.current && !pdfInternals.current) {
			pdfInternals.current = new PDFViewInternals(containerRef.current)
				.on('pagesinit', initCallback)
				.on('pagechanging', pageChangeCallback);
		}
	}, [containerRef, initCallback, pageChangeCallback]);

	/**
	 * Load Document action.
	 * Loads a PDF document into the viewer.
	 *
	 * @param url the url of the PDF file
	 */
	const loadDocument = useCallback((url: string) => {
		if (!pdfInternals.current || pdfInternals.current.docLoading) {
			return;
		}

		pdfInternals.current.docLoading = true;
		const loadingTask = pdfjs.getDocument({
			url,
			...options,
		});

		loadingTask.promise
			.then((doc) => {
				if (pdfInternals.current) {
					pdfInternals.current.viewer.setDocument(doc);
					pdfInternals.current.linkService.setDocument(doc, null);
				}
			})
			.finally(() => {
				if (pdfInternals.current) {
					pdfInternals.current.docLoading = false;
				}
			});
	}, []);

	/**
	 * Set current page action.
	 * Changes the current page showed by the viewer.
	 *
	 * @param currentPage the new page number
	 */
	const setCurrentPage = useCallback((currentPage: number) => {
		if (
			pdfInternals.current &&
			pdfInternals.current.viewer.currentPageNumber !== currentPage
		) {
			pdfInternals.current.viewer.currentPageNumber = currentPage;
		}
	}, []);

	/**
	 * Set scale action.
	 * Changes the scale of the document.
	 *
	 * @param scale the new scale (in fractional form)
	 */
	const setScale = useCallback((scale: number) => {
		if (pdfInternals.current) {
			pdfInternals.current.viewer.currentScale = scale;
		}
	}, []);

	return { loadDocument, setCurrentPage, setScale };
};

export default usePdfJs;
