export class QueryBuilder {
    constructor(query = {}) {
        this.query = query;
        this.filters = {};
    }

    search(field = "title") {
        if (this.query.search) {
            this.filters[field] = {
                $regex: this.query.search,
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

    build() {
        return this.filters;
    }
}