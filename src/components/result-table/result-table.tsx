import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Resizable } from 'react-resizable'
import { Table, Tooltip, Icon } from 'antd';
import { SearchContext } from '../../util/search-context';
import { dateConverter } from '../../util/date-conversion';
import { xmlParser } from '../../util/xml-parser';
import styles from './result-table.module.scss';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCode, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import ColumnSelector from '../../components/column-selector/column-selector';
import { tableParser, headerParser, deepCopy, reconstructHeader, toStringArray } from '../../util/data-conversion';
import ReactDragListView from 'react-drag-listview'


const ResizeableTitle = props => {
  const { onResize, width, ...restProps } = props;

  if (!width) {
    return <th {...restProps} />;
  }

  return (
    <Resizable
      width={width}
      height={0}
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  );
};

interface Props {
  data: any;
  entityDefArray: any[];
};

const DEFAULT_ALL_ENTITIES_HEADER = [
  {
    title: 'Identifier',
    key: '0-i'
  },
  {
    title: 'Entity',
    key: '0-1'
  },
  {
    title: 'File Type',
    key: '0-2'
  },
  {
    title: 'Created',
    key: '0-c'
  },
  {
    title: 'Detail View',
    key: '0-d'
  },
];

const ResultTable: React.FC<Props> = (props) => {
  const { searchOptions } = useContext(SearchContext);
  const [defaultColumns, setDefaultColumns] = useState<any[]>([]);
  const [renderColumns, setRenderColumns] = useState<any[]>([]);
  const [renderTableData, setRenderTableData] = useState<any[]>([]);
  const [checkedColumns, setCheckedColumns] = useState<any[]>([]);
  const [treeColumns, setTreeColumns] = useState<any[]>([]);
  let counter = 0;
  let parsedPayload = tableParser(props);
  let nestedColumns = new Set();

  useEffect(() => {
    if (props.data) {
      console.log('render cols', renderColumns);

      if (searchOptions.entityNames.length === 0 ) {
        // All Entities
        let renderHeader = tableHeader(DEFAULT_ALL_ENTITIES_HEADER);
        let newTableData = formatTableData(parsedPayload.data, true);
        // set render DOM data
        setRenderTableData(newTableData);
        setRenderColumns(renderHeader);
        //set popover tree data
        setTreeColumns(renderHeader);
        //set popover tree selected checkboxes data
        setCheckedColumns(renderHeader);
        // set default columns from payload
        // TODO set from user pref if it exists. save without tableHeader transform
        setDefaultColumns(DEFAULT_ALL_ENTITIES_HEADER);
      } else {
        // An Entity is selected
        let newRenderColumns: any[] = [];
        let parsedEntityDocObj = parsedPayload.data[0] && parsedPayload.data[0].itemEntityProperties[0];
        let columns = setPrimaryKeyColumn(headerParser(parsedEntityDocObj));
        
        if (defaultColumns.length === 0 ) {
          if (renderColumns.length === 0 ) {
            if (columns.length > 5) {
              // TODO Save user pref
              newRenderColumns = columns.slice(0, 5);
            } else {
              newRenderColumns = columns;
            }
          }

          let renderHeader = tableHeader(newRenderColumns);
          setRenderColumns(renderHeader);
          setRenderTableData(mergeRows(renderHeader));
          setTreeColumns(tableHeader(columns));
          setCheckedColumns(renderHeader);
          setDefaultColumns(columns);
        } else {
          if (renderColumns.length > 0) {
            let newRenderColumns: any[] = [];
            if (JSON.stringify(columns) !== JSON.stringify(renderColumns)) {
              if (columns.length > 5) {
                // TODO Save user pref
                newRenderColumns = columns.slice(0, 5);
              } else {
                newRenderColumns = columns;
              }
              let renderHeader = tableHeader(newRenderColumns);
              setRenderColumns(renderHeader);
              setRenderTableData(mergeRows(renderHeader));
              setTreeColumns(tableHeader(columns));
              setCheckedColumns(renderHeader);
              setDefaultColumns(columns);
            }
          }
        }
      }
    }
  }, [props.data]);

  const formatTableData = (payload: Array<Object>, isNested: boolean) => {
    let rowCounter = 0;
    let nested = [];
    let nestedId = 0;

    const parseData = (payload) => {
      let data = new Array();
      payload.forEach((item) => {
        let isUri = item.primaryKey === 'uri';
        let uri = encodeURIComponent(item.uri);
        let path = { pathname: `/detail/${isUri ? '-' : item.primaryKey}/${uri}` };
        let document = item.uri.split('/')[item.uri.split('/').length - 1];
        let date = dateConverter(item.createdOn);
        let row: any = {};
        let detailView =
          <div className={styles.redirectIcons}>
            <Link to={{ pathname: `${path.pathname}`, state: { selectedValue: 'instance' } }} id={'instance'}
              data-cy='instance'>
              <Tooltip title={'Show detail on a separate page'}><FontAwesomeIcon icon={faExternalLinkAlt} size="sm" /></Tooltip>
            </Link>
            <Link to={{ pathname: `${path.pathname}`, state: { selectedValue: 'source' } }} id={'source'}
              data-cy='source'>
              <Tooltip title={'Show source on a separate page'}><FontAwesomeIcon icon={faCode} size="sm" /></Tooltip>
            </Link>
          </div>

        if (searchOptions.entityNames.length === 0) {
          row =
          {
            key: rowCounter++,
            identifier: <Tooltip title={isUri && item.uri}>{isUri ? '.../' + document : item.primaryKey}</Tooltip>,
            entity: item.itemEntityName,
            filetype: item.format,
            created: date,
            primaryKeyPath: path,
            detailview: detailView,
            primaryKey: item.primaryKey
          }
        } else {
          row =
          {
            key: rowCounter++,
            created: date,
            primaryKeyPath: path,
            detailview: detailView,
            primaryKey: item.primaryKey
          }

          for (let propt in item.itemEntityProperties[0]) {
            if (isUri) {
              row.identifier = <Tooltip title={isUri ? item.uri : item.primaryKey}>{'.../' + document}</Tooltip>
            }
            if (parsedPayload.primaryKeys.includes(propt)) {
              row[propt.toLowerCase()] = item.itemEntityProperties[0][propt].toString();
            } else {
              if (typeof item.itemEntityProperties[0][propt] === 'object') {
                nested = item.itemEntityProperties[0][propt]
              } else {
                row[propt.toLowerCase()] = item.itemEntityProperties[0][propt].toString();
              }
            }
          }
        }

        if (isNested) {
          //if row has array of nested objects
          if (nested && nested instanceof Array && nested.length > 0) {
            nested.forEach((items, index) => {
              let parentRow = { ...row };
              let keys = Object.keys(items);
              let values = new Array<String>();
              if (typeof items === 'object' && keys.length === 1) {
                values = Object.values(items);
              }
              if(values.length){
                for (let key of Object.keys(values[0])) {
                  parentRow[key.toLowerCase()] = values[0][key].toString();
                  nestedColumns.add(key);
                }
              }
              parentRow.key = rowCounter++;
              parentRow.nestedId = nestedId;
              parentRow.nestedColumns = nestedColumns;
              parentRow.nested = nested;
              if (index === 0) {
                parentRow.isNested = true;
              }
              data.push(parentRow)
            })
            nestedId++;
            //if row has a nested object
          } else if (nested && !(nested instanceof Array)) {
            let parentRow = { ...row };
            let keys = Object.keys(nested);
            let values = [new Array<String>()];
            if (typeof nested === 'object' && keys.length === 1) {
              values = Object.values(nested);
            }
            for (let key of Object.keys(values[0])) {
              parentRow[key.toLowerCase()] = values[0][key].toString();
            }
            parentRow.key = rowCounter++;
            data.push(parentRow)
            //if row doesn't have nested objects
          } else {
            data.push(row)
          }
        } else {
          data.push(row)
        }
      });
      return data;
    }
    return parseData(payload);
  }

  const tableHeader = (columns) => {
    let col = new Array();
    let set = new Set();
    columns.forEach((item, index) => {
      if (item.hasOwnProperty('children')) {
        col.push({
          title: item.title,
          key: item.key,
          visible: true,
          children: tableHeader(item.children),
        })
      } else {
        col.push(
          {
            title: item.title,
            dataIndex: item.title.replace(/ /g, '').toLowerCase(),
            key: item.key,
            visible: true,
            width: 150,
            onHeaderCell: column => ({
              width: column.width,
              onResize: handleResize(item.title),
            }),
            onCell: () => {
              return {
                style: {
                  whiteSpace: 'nowrap',
                  maxWidth: 150,
                }
              }
            },
            render: (value, row, index) => {
              const obj = {
                children: (
                  <Tooltip
                    title={value && value.length > 50 && value.substring(0, 301).concat('...\n\n(View document details to see all of this text.)')}>
                    <div style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{value}</div>
                  </Tooltip>
                ),
                props: {
                  rowSpan: 1,
                }
              };

              if (row.hasOwnProperty('nestedId') && !nestedColumns.has(item.title)) {
                row.hasOwnProperty('isNested') && set.add(index);
                set.has(index) ? obj.props.rowSpan = row.nested.length : obj.props.rowSpan = 0;
              }
              return obj;
            },
          }
        )
      }
    });
    return col;
  }

  //set pk column to be first
  const setPrimaryKeyColumn = (obj) => {
    let a = [...obj];
    let pk;
    for (let i = 0; i < a.length; i++) {
      if (a[i].title === parsedPayload.entityTitle[0]) {
        pk = a.splice(i, 1);
        i--;
        break;
      }
    }
    pk && a.unshift(pk[0]);
    return a;
  }

  const components = {
    header: {
      cell: ResizeableTitle,
    },
  };

  const mergeRows = (header: Array<Object>) => {
    let data: Array<Object>;
    let hasNested: boolean = header.some((item: Object) => item.hasOwnProperty('children'));
    data = hasNested ? formatTableData(parsedPayload.data, true) : formatTableData(parsedPayload.data, false);
    return data;
  }

  const handleResize = title => (e, { size }) => {
    let index = 0;
    setRenderColumns(columns => {
      for (let i = 0; i < columns.length; i++) {
        if (title == columns[i].title)
          index = i;
      }
      const nextColumns = [...columns];
      nextColumns[index] = {
        ...nextColumns[index],
        width: size.width,
      };
      return nextColumns
    })
  };

  const dragProps = {
    onDragEnd(fromIndex: number, toIndex: number) {
      if (fromIndex > 0 && toIndex > 0) {
        const header = deepCopy(renderColumns);
        const tree = deepCopy(treeColumns);
        const colItem = header.splice(fromIndex - 1, 1)[0];
        const treeItem = tree.splice(fromIndex - 1, 1)[0];
        header.splice(toIndex - 1, 0, colItem);
        tree.splice(toIndex - 1, 0, treeItem);
        let updatedHeader = reconstructHeader(deepCopy(header), toStringArray(checkedColumns))
        setRenderColumns(updatedHeader);
        setTreeColumns(tree)
      }
    },
    nodeSelector: "th",
    handleSelector: 'span.ant-table-column-title',
  };


  const expandedRowRender = (rowId) => {
    const nestedColumns = [
      { title: 'Property', dataIndex: 'property', width: '30%' },
      { title: 'Value', dataIndex: 'value', width: '30%' },
      { title: 'View', dataIndex: 'view', width: '30%' },
    ];

    let nestedData: any[] = [];
    const parseJson = (obj: Object) => {
      let parsedData = new Array();
      for (var i in obj) {
        if (obj[i] !== null && typeof (obj[i]) === "object") {
          parsedData.push({
            key: counter++,
            property: i,
            children: parseJson(obj[i]),
            view: <Link to={{ pathname: `${rowId.primaryKeyPath.pathname}`, state: { id: obj[i] } }}
              data-cy='nested-instance'>
              <Tooltip title={'Show nested detail on a separate page'}><FontAwesomeIcon icon={faExternalLinkAlt}
                size="sm" /></Tooltip>
            </Link>
          });
        } else {
          parsedData.push({
            key: counter++,
            property: i,
            value: typeof obj[i] === 'boolean' ? obj[i].toString() : obj[i],
            view: null
          });
        }
      }
      return parsedData;
    }

    let index:string = '';
    for(let i in parsedPayload.data){
      if(parsedPayload.data[i].primaryKey == rowId.primaryKey){
        index = i;
      }
    }

    nestedData = parseJson(parsedPayload.data[index].itemEntityProperties[0]);

    return <Table
      rowKey="key"
      columns={nestedColumns}
      dataSource={nestedData}
      pagination={false}
      className={styles.nestedTable}
    />;
  }

  const headerRender = (col) => {
    setRenderColumns(col);
    setCheckedColumns(deepCopy(col))
  }

  let icons: any = [];
  let expIcons: any = [];
  function expandIcon({expanded, expandable, record, onExpand}) {
    if (expanded && record.nestedColumns) {
      expIcons.push(record.primaryKey);
    }
    if (record.nestedColumns && icons.indexOf(record.primaryKey) != -1 && expIcons.indexOf(record.primaryKey) == -1) {
      return null;
    }
    icons.push(record.primaryKey);
    return (
        <a style={{color: 'black'}} onClick={e => onExpand(record, e)}>
          {expanded ? <Icon type="down"/> : <Icon type="right"/>}
        </a>
    );
  }
  
  return (
    <>
      <div className={styles.columnSelector} data-cy="column-selector">
        <ColumnSelector title={checkedColumns} tree={treeColumns} headerRender={headerRender} />
      </div>
      <ReactDragListView.DragColumn {...dragProps}>
        <div className={styles.tabular}>        
          <Table bordered components={components}
            className="search-tabular"
            rowKey="key"
            dataSource={renderTableData}
            columns={renderColumns}
            pagination={false}
            expandedRowRender={expandedRowRender}
            expandIcon={expandIcon}
            data-cy="search-tabular"
          />
        </div>
      </ReactDragListView.DragColumn>
    </>
  );
}

export default ResultTable