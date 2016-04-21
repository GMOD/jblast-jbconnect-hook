console.log("gridDataSource.js");
// Define the data to be displayed in the repeater.
function staticDataSource(options, callback) {
    console.log("staticDataSource");
    // Define the columns for the grid
    var columns = [{
        'label': 'Name', // Column header label.
        'property': 'name', // The JSON property you are binding to.
        'sortable': true // Is the column sortable.
    }, {
        'label': 'Description',
        'property': 'description',
        'sortable': true
    }, {
        'label': 'Status',
        'property': 'status',
        'sortable': true
/*    }, {
        'label': 'Category',
        'property': 'category',
        'sortable': true */
    }];

    // Generate the rows in your dataset.
    // NOTE: The property names of your items should
    // match the column properties defined above.
    function generateDummyData() {
        console.log('generateDummyData');
        var items = [];
        var amountOfItems = 100; //Change this number
        var statuses = ['Archived', 'Active', 'Draft'];
        var categories = ['New', 'Old', 'Upcoming'];

        function getRandomStatus() {
            var index = Math.floor(Math.random() * statuses.length);
            return statuses[index];
        }

        function getRandomCategory() {
            var index = Math.floor(Math.random() * categories.length);
            return categories[index];
        }

        for (var i = 1; i <= amountOfItems; i++) {
            var item = {
                id: i,
                name: 'Item ' + i,
                description: 'Desc ' + i,
                status: getRandomStatus(),
                category: getRandomCategory()
            }
            items.push(item);
        };

        // Uncomment these to see in your console the
        // JSON payload produced by this function.
        //console.log(JSON.stringify(items));
        //console.table(items);

        return items;
    }

    var items = generateDummyData();

    // These are the visible UI options of the repeater,
    // such as how many items to display per page. They
    // are provided by the Fuel library.
    //console.log(options);

    // Set the values that will be used in your dataSource.
    var pageIndex = options.pageIndex;
    var pageSize = options.pageSize;
    var totalItems = items.length;
    var totalPages = Math.ceil(totalItems / pageSize);
    var startIndex = (pageIndex * pageSize) + 1;
    var endIndex = (startIndex + pageSize) - 1;
    if (endIndex > totalItems) {
        endIndex = totalItems;
    }
    var rows = items.slice(startIndex - 1, endIndex);

    // Define the datasource.
    var dataSource = {
        'page': pageIndex,
        'pages': totalPages,
        'count': totalItems,
        'start': startIndex,
        'end': endIndex,
        'columns': columns,
        'items': rows
    };

    console.log(dataSource);

    // Pass the datasource back to the repeater.
    callback(dataSource);
}


