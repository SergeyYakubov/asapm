import {InMemoryCache} from "@apollo/client";
import {columnsVar} from "./pages/CollectionListPage";
import {collectionFilterVar,beamtimeFilterVar} from "./components/FilterBoxes";

export const cache: InMemoryCache = new InMemoryCache({
    typePolicies: {
        BeamtimeMeta: {
            fields: {
                customValues: {
                    merge(existing, incoming) {
                        return incoming;
                    },
                },
            },
        },
        CollectionEntry: {
            fields: {
                customValues: {
                    merge(existing, incoming) {
                        return incoming;
                    },
                },
            },
        },
        Query: {
            fields: {
                columns: {
                    read () {
                        return columnsVar();
                    },
                },
                collectionFilter: {
                    read () {
                        return collectionFilterVar();
                    },
                },
                beamtimeFilter: {
                    read () {
                        return beamtimeFilterVar();
                    },
                },
            }
        }
    }
});
