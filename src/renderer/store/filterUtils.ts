import { Wavedata } from '../../types';

const SEARCHABLE_FIELDS = [
	'filename',
	'show',
	'category',
	'subcategory',
	'scene',
	'take',
	'ixmlNote',
] as const;

export function filterFiles(
	files: Wavedata[],
	searchText: string,
	searchField: string
): Wavedata[] {
	const lowercasedFilter = searchText.toLowerCase();
	if (!lowercasedFilter) return [...files];

	return files.filter((file) => {
		if (searchField === 'all') {
			return SEARCHABLE_FIELDS.some((field) => {
				const fieldValue = file[field as keyof Wavedata] as string;
				return String(fieldValue || '')
					.toLowerCase()
					.includes(lowercasedFilter);
			});
		}

		const fieldValue = file[searchField as keyof Wavedata] as string;
		return String(fieldValue || '')
			.toLowerCase()
			.includes(lowercasedFilter);
	});
}
