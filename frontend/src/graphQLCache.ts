import {InMemoryCache} from "@apollo/client";
import {columnsVar} from "./pages/CollectionListPage";
import {collectionFilterVar,beamtimeFilterVar} from "./components/FilterBoxes";

export const cache: InMemoryCache = new InMemoryCache({
    typePolicies: {
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
