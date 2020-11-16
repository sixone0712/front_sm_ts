import { DownloadOutlined, SyncOutlined } from '@ant-design/icons';
import {
  Breadcrumb,
  Button,
  Col,
  Layout,
  Result,
  Row,
  Space,
  Table,
} from 'antd';
import { ColumnsType } from 'antd/es/table';
import { TableRowSelection } from 'antd/es/table/interface';
import axios, { AxiosResponse } from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { execFileDownload } from '../../../api/download';
import { openNotification } from '../../../api/notification';
import { useDashBoardState } from '../../../contexts/DashboardContext';
import * as DEFINE from '../../../define';
import useAsyncAxios from '../../../hooks/useAsyncAxios';

const { Content } = Layout;

// Type
export type LogFile = {
  key: React.Key;
  fileType: string;
  fileName: string;
  fileSize: string;
};

export type LogFileList = LogFile[];

export enum LogType {
  USER_LOGIN_OUT = 'user',
  USER_CONTROL = 'control',
  DOWNLOAD_INFO = 'download',
  ESP_OTS_PROCESS = 'subsystem',
  ERROR_EXCEPTION = 'exception',
  TOMCAT = 'tomcat',
  ETC = 'etc',
}

export type CancelInfo = {
  downloadId: string | null;
  cancel: boolean;
  isDownloading: boolean;
};

const logFilter = [
  {
    text: 'User Login/Logout',
    value: LogType.USER_LOGIN_OUT,
  },
  {
    text: 'User Control',
    value: LogType.USER_CONTROL,
  },
  {
    text: 'Download Infomation',
    value: LogType.DOWNLOAD_INFO,
  },
  {
    text: 'ESP/OTS Process',
    value: LogType.ESP_OTS_PROCESS,
  },
  {
    text: 'Error Exception',
    value: LogType.ERROR_EXCEPTION,
  },
  {
    text: 'Tomcat',
    value: LogType.TOMCAT,
  },
  {
    text: 'etc',
    value: LogType.ETC,
  },
];

// const loadFirstName: PromiseFn<any> = ({ userId }) =>
//   fetch(`https://reqres.in/api/users/${userId}`)
//     .then(res => (res.ok ? Promise.resolve(res) : Promise.reject(res)))
//     .then(res => res.json())
//     .then(({ data }) => data.first_name);

// const loadFirstName: DeferFn<any> = async (args: string[]) => {
//   const { data } = await axios.get(`https://1reqres.in/api/users/${args[0]}`);
//   console.log('axios_data', data);
//   return data.data.first_name;
// };

const loadFileList = (device: string | null): Promise<AxiosResponse<any>> => {
  return axios.get(`${DEFINE.URL_DEBUG_LOG_FILES}?device=${device}`);
};

function LogTable(): JSX.Element {
  const {
    deviceInfo: { list, success, error, failure, pending, selected },
  } = useDashBoardState();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [listState, listRefetch] = useAsyncAxios(
    () => loadFileList(selected),
    [selected],
    true,
  );
  const [fileList, setFileList] = useState<LogFileList>([]);
  const cancelInfo = useRef<CancelInfo>({
    downloadId: null,
    cancel: false,
    isDownloading: false,
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentDataSource, setCurrentDataSource] = useState<LogFile[]>([]);
  const [filteredValue, setFilteredValue] = useState<React.Key[]>([]);

  useEffect(() => {
    if (listState.error) {
      openNotification(
        'error',
        'Error',
        `Failed to get file list of ${selected} due to server problem.`,
      );
    }
  }, [listState.error]);

  useEffect(() => {
    const { list } = listState?.data?.data || { list: [] };

    console.log('[LogTable][useEffect_1]list', list);
    const addKeyList: LogFileList = list.map(
      (
        list: { fileName: string; fileType: string; fileSize: string },
        index: number,
      ) => {
        return {
          //key: list.fileName,
          key: index,
          ...list,
        };
      },
    );
    setFileList(addKeyList);
  }, [listState.data]);

  console.log('[LogTable]fileList', fileList);

  useEffect(() => {
    if (selected) {
      // setCurrentPage(1);
      // setSelectedRowKeys([]);
      // setCurrentDataSource([]);
      // setFilteredValue([]);
      // listRefetch().then(r => r);
      onRefersh();
    }
  }, [selected]);

  const onRefersh = () => {
    setCurrentPage(1);
    setSelectedRowKeys([]);
    setCurrentDataSource([]);
    setFilteredValue([]);
    listRefetch().then(r => r);
  };

  console.log('listState', listState);
  console.log('selectedRowKeys', selectedRowKeys);

  /*
  const { data, error, isLoading, run } = useAsync({
    deferFn: loadFirstName,
    userId: 1,
  });

  console.log('isLoading', isLoading);
  console.log('error', error);
  console.log('data', data);

  const getFileList() => {
    console.log('download');
    run(['1']);
  }
  */

  const onSelectChange = (
    selectedRowKeys: React.Key[],
    selectedRows: LogFileList,
  ) => {
    console.log('selectedRowKeys changed: ', selectedRowKeys);
    setSelectedRowKeys(selectedRowKeys);
  };

  const rowSelection: TableRowSelection<LogFile> = {
    selectedRowKeys,
    onChange: onSelectChange,
    onSelectAll: (selected, selectedRows, changeRows) => {
      console.log('onSelectAll', selected, selectedRows, changeRows);
      if (selected) {
        if (currentDataSource.length === 0) {
          setSelectedRowKeys(fileList.map(item => item.key));
        } else {
          setSelectedRowKeys(currentDataSource.map(item => item.key));
        }
      } else {
        setSelectedRowKeys([]);
      }
    },
  };

  const onDownloadFile = () => {
    const selectedFileList: LogFileList = fileList.filter(list => {
      return selectedRowKeys.find(key => key === list.key) !== undefined;
    });
    console.log('selectedFileList', selectedFileList);
    if (selected) {
      execFileDownload(selected, selectedFileList, cancelInfo);
    }
  };

  const onRow = (record: LogFile, rowIndex: number | undefined) => {
    return {
      onClick: (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        console.log('onRow/rowIndex', rowIndex);
        console.log('onRow/record', record);
        if (record.key !== undefined) {
          let newselectedRowKeys;
          if (selectedRowKeys.find(item => item === record.key) !== undefined) {
            newselectedRowKeys = selectedRowKeys.filter(
              item => item !== record.key,
            );
          } else {
            newselectedRowKeys = selectedRowKeys.concat(record.key);
          }
          setSelectedRowKeys(newselectedRowKeys);
        }
      },
    };
  };

  const columData: ColumnsType<LogFile> = [
    {
      title: 'File Type',
      dataIndex: 'fileType',
      key: 'fileType',
      width: '35%',
      filters: logFilter,
      onFilter: (value: string | number | boolean, record: LogFile) =>
        typeof value === 'string' && record.fileType.indexOf(value) === 0,
      align: 'center',
      filteredValue: filteredValue,
    },
    {
      title: 'File Name',
      dataIndex: 'fileName',
      key: 'fileName',
      width: '50%',
      align: 'center',
    },
    {
      title: 'File Size',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: '15%',
      align: 'center',
    },
  ];

  return (
    <Layout>
      <Content
        style={{
          paddingLeft: '24px',
          margin: 0,
          minHeight: 280,
        }}
      >
        <Breadcrumb style={{ margin: '10px 0' }}>
          <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
          <Breadcrumb.Item>System</Breadcrumb.Item>
          <Breadcrumb.Item>Log Download</Breadcrumb.Item>
          {selected && <Breadcrumb.Item>{selected}</Breadcrumb.Item>}
        </Breadcrumb>
        {!selected && <Result title="Please select a device." />}
        {selected && (
          <>
            <Row
              justify="space-between"
              align="middle"
              style={{ marginBottom: '10px' }}
            >
              <Col
                style={{ marginLeft: '10px' }}
              >{`${selectedRowKeys.length} Files Selected`}</Col>
              <Space>
                <Button
                  type="primary"
                  icon={<SyncOutlined />}
                  onClick={onRefersh}
                >
                  Reload
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={onDownloadFile}
                  disabled={selectedRowKeys.length <= 0}
                  type="primary"
                  danger
                >
                  Download
                </Button>
              </Space>
            </Row>
            <Table
              rowKey={(record: LogFile) => record.key}
              tableLayout="fixed"
              size="small"
              bordered
              columns={columData}
              rowSelection={rowSelection}
              dataSource={fileList}
              pagination={{
                pageSize: 7,
                position: ['bottomCenter'],
                current: currentPage,
                defaultCurrent: 1,
                onChange: (page, pageSize) => {
                  setCurrentPage(page);
                },
              }}
              onChange={(
                pagination,
                filters,
                sorter,
                { currentDataSource, action },
              ) => {
                console.log('action', action);
                if (action === 'filter') {
                  console.log('filters', filters);
                  console.log('currentDataSource', currentDataSource);
                  if (!filters.fileType) {
                    setCurrentDataSource([]);
                    setFilteredValue([]);
                  } else {
                    setCurrentDataSource(currentDataSource);
                    setFilteredValue(filters.fileType);
                  }
                  setSelectedRowKeys([]);
                }
              }}
              loading={listState.loading}
              onRow={onRow}
            />
          </>
        )}
      </Content>
    </Layout>
  );
}

export default LogTable;
