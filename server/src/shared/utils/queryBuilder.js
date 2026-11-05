export class QueryBuilder {
	constructor(query = {}) {
		this.query = query;
		this.filters = {};

		this.page = 1;
		this.limit = 20;
		this.skip = 0;

		this.sortOptions = {
			isPinned: -1,
			lastMessageAt: -1,
		}
	}

	search(field = "title") {
		if (this.query.search) {
			this.filters[field] = {
				$regex: this.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
				$options: "i",
			};
		}

		return this;
	}

	filter(field) {
		if (
			this.query[field] !== undefined &&
			this.query[field] !== ""
		) {
			let value = this.query[field];

			// Convert boolean strings
			if (value === "true") value = true;
			if (value === "false") value = false;

			this.filters[field] = value;
		}

		return this;
	}

	paginate() {
		// Calculate skip from validated page/limit values so repositories can reuse it directly.
		this.page = Math.max(
			parseInt(this.query.page) || 1,
			1
		);

		this.limit = Math.max(
			parseInt(this.query.limit) || 20,
			1
		);

		this.skip = (this.page - 1) * this.limit;

		return this;
	}

	sort(defaultSort = {
		isPinned: -1,
		lastMessageAt: -1,
	}) {
		this.sortOptions = defaultSort;
		return this;
	}

	build() {
		return {
			filters: this.filters,
			page: this.page,
			limit: this.limit,
			skip: this.skip,
			sort: this.sortOptions
		};
	}
}
