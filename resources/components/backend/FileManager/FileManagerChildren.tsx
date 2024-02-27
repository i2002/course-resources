// import { getResDate, getResSize } from '@/lib/utils';
import { Fragment, useEffect, useRef } from '@wordpress/element';
import type { ChangeEvent, MouseEvent } from 'react';
import type { Resource } from '../../../lib/file-data-types';
import { getResDate, getResSize } from '../../../lib/utils';
import ResourceIcon from '../ui/ResourceIcon';
import { useFileManagerContext } from './FileManagerContext';

const DataLoading = ({ rows }: { rows: number }) =>
	[...Array(rows)].map((_el, i) => (
		<Fragment key={i}>
			<div className="tw-px-3 tw-py-2 hover:tw-bg-slate-50 tw-rounded tw-border-b-slate-200 tw-border-b tw-gap-2">
				<div className="tw-animate-pulse tw-h-2 tw-my-2 tw-rounded-full tw-bg-slate-200"></div>
			</div>
		</Fragment>
	));

export default function FileManagerChildren() {
	const { resources, loading, selected, setParent, setPreview, setSelected } =
		useFileManagerContext();
	const checkboxRef = useRef<HTMLInputElement>(null);

	// selection handlers
	const checkboxHandler = (
		e: ChangeEvent<HTMLInputElement>,
		res: Resource
	) => {
		if (e.currentTarget.checked) {
			setSelected((prev) => [...prev, res]);
		} else {
			setSelected((prev) => prev.filter((other) => other !== res));
		}
		e.stopPropagation();
	};

	const selectionCheckboxHandler = (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.checked) {
			setSelected(resources);
		} else {
			setSelected([]);
		}
	};

	const shiftSelectionHandler = (
		e: MouseEvent<HTMLInputElement>,
		child: Resource
	) => {
		e.stopPropagation();
		const resChecked = selected.includes(child);
		if (e.shiftKey && selected.length !== 0) {
			let found = false;
			for (const res of resources) {
				if (res === child) {
					break;
				}

				if (!found) {
					if (selected.includes(res)) {
						found = true;
					}
				} else if (!selected.includes(res) && !resChecked) {
					setSelected((prev) => [...prev, res]);
				}
			}
		}
	};

	const openResourceHandler = (res: Resource) => {
		if (res.type === 'folder') {
			setParent(res.id);
		} else if (res.type === 'file') {
			setPreview(res.id);
		}
	};

	// select all checkbox indeterminate state
	useEffect(() => {
		if (checkboxRef.current) {
			checkboxRef.current.indeterminate =
				selected.length > 0 && selected.length < resources.length;
		}
	}, [selected, resources, checkboxRef]);

	return (
		<div className="tw-mt-2 tw-rounded tw-border tw-border-slate-200 tw-text-sm">
			<div className="tw-py-2.5 tw-px-3 tw-grid tw-grid-cols-[auto_auto_1fr_100px_100px] tw-items-center tw-gap-2 tw-text-sm tw-border-b tw-border-slate-300 tw-font-bold tw-text-slate-500">
				<input
					type="checkbox"
					ref={checkboxRef}
					className="tw-form-checkbox"
					title={
						selected.length === 0
							? 'Niciunul selectat'
							: `${selected.length} ${selected.length === 1 ? 'selectat' : 'selectate'}`
					}
					checked={
						selected.length === resources.length &&
						selected.length !== 0
					}
					onChange={selectionCheckboxHandler}
				/>
				<span className="tw-col-span-2">Nume</span>
				<span>Dimensiune</span>
				<span>Modificat la</span>
			</div>
			{resources.map((child) => (
				<div
					key={`${child.type}-${child.id}`}
					aria-hidden="true"
					role="button"
					tabIndex={0}
					className={`tw-px-3 tw-py-2 hover:tw-bg-slate-50 tw-rounded tw-grid tw-grid-cols-[auto_auto_1fr_100px_100px] tw-items-center tw-border-b-slate-200 tw-border-b tw-gap-2 tw-cursor-default ${loading ? 'tw-pointer-events-none tw-select-none tw-opacity-50' : ''}`}
					onClick={(e) =>
						(e.target as HTMLElement).tagName.toLowerCase() !==
							'div' && openResourceHandler(child)
					}
				>
					<input
						type="checkbox"
						className="tw-form-checkbox"
						checked={selected.includes(child)}
						onClick={(e) => shiftSelectionHandler(e, child)}
						onChange={(e) => checkboxHandler(e, child)}
					/>
					<ResourceIcon
						type={child.type}
						className="tw-w-4 tw-h-4 tw-cursor-pointer"
					/>
					<span
						className="tw-truncate tw-cursor-pointer"
						title={child.name}
						//  dangerouslySetInnerHTML={{ __html: child.name }}
					>
						{child.name}
					</span>
					<span className="tw-truncate tw-cursor-pointer">
						{getResSize(child)}
					</span>
					<span
						className="tw-truncate tw-cursor-pointer"
						title={getResDate(child, 'full')}
					>
						{getResDate(child)}
						{/* <span>a</span> */}
					</span>
				</div>
			))}
			{resources.length === 0 &&
				((loading && <DataLoading rows={3} />) || (
					<div className="tw-text-center tw-py-4 tw-text-slate-400">
						Acest director nu conține niciun fișier.
					</div>
				))}
		</div>
	);
}
