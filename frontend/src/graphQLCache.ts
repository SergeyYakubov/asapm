import {InMemoryCache} from "@apollo/client";
import {columnsVar} from "./CollectionListPage";
import {collectionFilterVar} from "./FilterBoxes";

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
            }
        }
    }
});
