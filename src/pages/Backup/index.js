import { Space, message, Button, Modal, Input } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import { SearchOutlined } from '@ant-design/icons';
// import Highlighter from 'react-highlight-words';
import BackupStatistic from './Statistic';

import {
  getBackupApi,
  deleteBackupApi,
  renameBackupApi,
  openBackupDir
} from '../../api/window/backupWindowsApi';
import { getColumns } from './getColumns';
import { getHeaderTitle } from './getHeaderTitle';


const Backup = () => {

  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef(null);
  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };
  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText('');
  };
  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
      <div
        style={{
          padding: 8,
        }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{
            marginBottom: 8,
            display: 'block',
          }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{
              width: 90,
            }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{
              width: 90,
            }}
          >
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({
                closeDropdown: false,
              });
              setSearchText(selectedKeys[0]);
              setSearchedColumn(dataIndex);
            }}
          >
            Filter
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined
        style={{
          color: filtered ? '#1890ff' : undefined,
        }}
      />
    ),
    onFilter: (value, record) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      // searchedColumn === dataIndex ? (
      //   <Highlighter
      //     highlightStyle={{
      //       backgroundColor: '#ffc069',
      //       padding: 0,
      //     }}
      //     searchWords={[searchText]}
      //     autoEscape
      //     textToHighlight={text ? text.toString() : ''}
      //   />
      // ) : (
      //   text
      // ),
      text
  });



  const actionRef = useRef();

  //?????????????????????
  const [selectBackup, setSelectBackup] = useState({})
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [backupSize, setBackupSize] = useState(0)

  const [backupData, setBackupData] = useState([])

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteBackup, setDeleteBackup] = useState({});

  const [confirmLoading, setConfirmLoading] = useState(false);


  const inputRef = useRef("");

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys, selectedRows) => {
      console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows)
      setSelectedRowKeys(selectedRowKeys)
      setSelectBackup(selectedRows)
    },
  }

  const updateBackupData = () => {
    const data = getBackupApi()
    const backupList = data || []
    for (let i = 0; i < backupList.length; i++) {
      backupList[i].key = i
    }

    setBackupData(backupList.sort((a, b) => b.createTime.getTime() - a.createTime.getTime()))
    const totalSize = backupList
      .map(backup => backup.fileSize)
      .reduce((prev, curr) => !isNaN(Number(curr)) ? prev + curr : prev, 0) / 1024 / 1024 / 1024
    setBackupSize(totalSize.toFixed(4))
  }

  useEffect(() => {
    updateBackupData()
  }, [])



  const deleteSelectBackup = () => {
    const length = selectBackup.length
    if (length < 1) {
      message.warning("???????????????")
      return
    }
    const fileNames = selectBackup.map(item => item.fileName)
    deleteBackupApi(fileNames)
      .then(data => {
        console.log(data);
        message.success("????????????")
        setSelectBackup([])
        setSelectedRowKeys([])
        updateBackupData()
      })
  }

  const deletBackupItem = (value) => {
    setConfirmLoading(true);
    deleteBackupApi([value.fileName])
      .then(data => {
        setTimeout(() => {
          message.success("????????????")
          setSelectBackup([])
          setConfirmLoading(false);
          setIsDeleteModalOpen(false)
          updateBackupData()
        }, 500);
      })
  }

  const renameBackupItem = (value) => {
    setConfirmLoading(true);

    const data = {
      fileName: value.fileName,
      newName: inputRef.current.input.value + ".zip"
    }
    renameBackupApi(data)
      .then(data => {
        setTimeout(() => {
          message.success("???????????????")
          // setBackupData(newBackupData)
          updateBackupData()
        }, 500);
      })
      .catch(error => {
        message.error("????????????")
        console.log(error);

      }).finally(() => {
        setConfirmLoading(false);
        setIsEditModalOpen(false)
      });
  }

  const columns = getColumns({
    getColumnSearchProps,
    setIsEditModalOpen,
    setDeleteBackup,
    openBackupDir,
    setIsDeleteModalOpen
  })

  const HeaderTitle = getHeaderTitle({
    openBackupDir,
    deleteSelectBackup,
    updateBackupData
  })

  const EditModal = () => (
    <Modal title="???????????????"
      open={isEditModalOpen}
      confirmLoading={confirmLoading}
      getContainer={false}
      onOk={() => { renameBackupItem(deleteBackup) }}
      onCancel={() => { setIsEditModalOpen(false) }}
    >
      <br />
      <span>??????????????????{deleteBackup.fileName}</span>
      <br /><br />
      <Input allowClear placeholder="???????????????" ref={inputRef} />
    </Modal>
  )

  const DeletetModal = () => (
    <Modal title="??????" open={isDeleteModalOpen}
      confirmLoading={confirmLoading}
      getContainer={false}
      onOk={() => { deletBackupItem(deleteBackup) }}
      onCancel={() => { setIsDeleteModalOpen(false) }}
    >
      <p>???????????????</p>
      <p>{deleteBackup.fileName || ""}</p>
    </Modal>
  )


  return (
    <>
      <BackupStatistic size={backupSize} length={backupData.length} />
      <br />

      <ProTable
        scroll={{
          x: 500,
        }}
        headerTitle={
          <HeaderTitle />
        }
        columns={columns}
        dataSource={backupData}
        rowSelection={rowSelection}
        pagination={{
          position: ['none'],
          pageSize: 99999
        }}
        // bordered
        search={false}
        cardBordered
        actionRef={actionRef}

      />

      <EditModal />
      <DeletetModal />

    </>
  )
};
export default Backup;