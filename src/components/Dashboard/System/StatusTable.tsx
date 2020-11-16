import React, { useEffect, useState } from 'react';
import { Breadcrumb, Button, Col, Layout, Row, Table } from 'antd';
import { RedoOutlined, SyncOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import {
  loadDeviceList,
  useDashBoardDispatch,
  useDashBoardState,
} from '../../../contexts/DashboardContext';
import OsRestartModal from './OsRestartModal';
import { execDockerRestart } from '../../../api/restart';
import { BsFillCircleFill } from 'react-icons/bs';
import { openNotification } from '../../../api/notification';
import { LogFile } from './LogTable';

const { Column } = Table;

export type DockerStatus = {
  key: React.Key;
  type: string;
  name: string;
  ip: string;
  status: string[];
  volume: string;
};

export type DockerStatusList = DockerStatus[];

const StatusColor = styled(Col)`
  color: ${({ status }: { status: string }) => {
    if (status.includes('Up')) {
      return '#90EE90'; // LightGreen
    }
    if (status.includes('Exited')) {
      return '#FF4500'; // OragneRed
    }
    return '#778899'; // LightSlateGray
  }};
`;

const StatusText = styled(Col)`
  padding-left: 5px;
`;

function StatusTable(): JSX.Element {
  const {
    deviceInfo: { list, success, error, failure, pending, selected },
  } = useDashBoardState();
  const dispatch = useDashBoardDispatch();
  const [osModalVisible, setOsModalVisible] = useState(false);
  const [targetDevice, setTargetDevice] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    if (error) {
      openNotification(
        'error',
        'Error',
        `Failed to get "Device Status" due to server problem.`,
      );
    }
  }, [error]);

  const onRefresh = () => {
    setCurrentPage(1);
    loadDeviceList(dispatch).then(r => r);
  };

  const renderStatus = (
    text: string[],
    record: DockerStatus,
    index: number,
  ) => {
    // console.log('name', text);
    // console.log('record', record);
    // console.log('index', index);
    return (
      <>
        {text.map(item => (
          <Row justify="center" align="middle">
            <StatusColor status={item}>
              <BsFillCircleFill />
            </StatusColor>
            <StatusText>{item}</StatusText>
          </Row>
        ))}
      </>
    );
  };

  const renderDockerRestart = (
    text: string,
    record: DockerStatus,
    index: number,
  ) => {
    return (
      <RedoOutlined
        onClick={() => {
          setTargetDevice(text);
          onDockerRestart(text);
        }}
      />
    );
  };

  const renderOsRestart = (
    text: string,
    record: DockerStatus,
    index: number,
  ) => {
    console.log('OSRender');
    console.log('text', text);
    console.log('record', record);
    console.log('index', index);
    return (
      <RedoOutlined
        onClick={() => {
          setTargetDevice(text);
          onOsRestart(text);
        }}
      />
    );
  };

  const onDockerRestart = (text: string) => {
    execDockerRestart(text, onRefresh);
  };

  const onOsRestart = (text: string) => {
    setOsModalVisible(true);
  };

  return (
    <Layout style={{ height: '360px', minWidth: '950px' }}>
      <Breadcrumb style={{ margin: '10px 0' }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>System</Breadcrumb.Item>
        <Breadcrumb.Item>Device Status</Breadcrumb.Item>
      </Breadcrumb>
      <Row justify="end" style={{ marginBottom: '10px' }}>
        <Button
          style={{ width: '100px' }}
          type="primary"
          icon={<SyncOutlined />}
          onClick={onRefresh}
        >
          Reload
        </Button>
      </Row>
      <Table
        rowKey={(record: DockerStatus) => record.key}
        tableLayout="fixed"
        size="small"
        bordered
        dataSource={pending ? [] : list}
        pagination={{
          pageSize: 4,
          position: ['bottomCenter'],
          current: currentPage,
          defaultCurrent: 1,
          onChange: (page, pageSize) => {
            setCurrentPage(page);
          },
        }}
        loading={pending}
      >
        <Column
          title="Name"
          dataIndex="name"
          key="name"
          align="center"
          width="15%"
        />
        <Column
          title="IP Address"
          dataIndex="ip"
          key="ip"
          align="center"
          width="15%"
        />
        <Column
          title="Docker Status"
          dataIndex="status"
          key="status"
          align="center"
          width="35%"
          render={renderStatus}
        />
        <Column
          title="Volume"
          dataIndex="volume"
          key="volume"
          align="center"
          width="15%"
        />
        <Column
          title="Docker Restart"
          dataIndex="name"
          key="name"
          align="center"
          width="15%"
          render={renderDockerRestart}
        />
        <Column
          title="OS Restart"
          dataIndex="name"
          key="name"
          align="center"
          width="15%"
          render={renderOsRestart}
        />
      </Table>
      <OsRestartModal
        visible={osModalVisible}
        setVisible={setOsModalVisible}
        targetDevice={targetDevice}
      />
    </Layout>
  );
}

export default StatusTable;
