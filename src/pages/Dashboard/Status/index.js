import { Card, message, Button, Form, Space } from 'antd';
import { useEffect, useState } from 'react';

import { createBackupApi, openDir } from '../../../api/window/backupWindowsApi';

import { readDstConfigSync } from '../../../api/window/dstConfigApi';
import RestoreBackup from './restoreBackup';
import CleanArchive from './cleanArchive';

const cmd = window.require('node-cmd');

function launchDstMasterCmd() {
    const config = readDstConfigSync()
    const dstexe = window.require('path').join(config.force_install_dir, "bin64")
    const cluster = config.cluster
    const cmd = 'cd ' + dstexe + ' && Start "Master" dontstarve_dedicated_server_nullrenderer_x64.exe -console -cluster ' + cluster + ' -shard Master'
    return cmd
}

function launchDstCavesCmd() {
    const config = readDstConfigSync()
    const dstexe = window.require('path').join(config.force_install_dir, "bin64")
    const cluster = config.cluster
    const cmd = 'cd ' + dstexe + ' && Start "Caves" dontstarve_dedicated_server_nullrenderer_x64.exe -console -cluster ' + cluster + ' -shard Caves'
    return cmd
}

function launchDstMaster() {
    const processRef = cmd.run(launchDstMasterCmd())
    let data_line = '';

    //listen to the python terminal output
    processRef.stdout.on(
        'data',
        function (data) {
            data_line += data;
            if (data_line[data_line.length - 1] === '\n') {
                console.log(data_line);
            }
        }
    )
}

function launchDstCaves() {
    const processRef = cmd.run(launchDstCavesCmd())
    let data_line = '';

    //listen to the python terminal output
    processRef.stdout.on(
        'data',
        function (data) {
            data_line += data;
            if (data_line[data_line.length - 1] === '\n') {
                console.log(data_line);
            }
        }
    )
}

function updateDst(callback) {
    const config = readDstConfigSync()
    const updateCommand = 'Start steamcmd +login anonymous +force_install_dir ' + config.force_install_dir + ' +app_update 343050 validate +quit'
    const command = 'cd ' + config.steamcmd + ' && ' + updateCommand

    cmd.run(command, (err, data, stderr) => {
        callback(err, data, stderr)
    }
    );
}


const GameStatus = (props) => {

    const [updateGameStatus, setUpdateStatus] = useState(false)
    const [createBackupStatus, setCreateBackupStatus] = useState(false)
    const [mode, setMode] = useState(false)

    useEffect(() => {
        const dstConfig = readDstConfigSync()
        if (dstConfig.mode === 1) {
            setMode(true)
        }
    }, [])

    const launchOnClick = () => {
        launchDstMaster()
        launchDstCaves()
    }

    const updateGameOnclick = () => {
        message.success('??????????????????')
        setUpdateStatus(true)
        updateDst((err, data, stderr) => {
            if (err !== null) {
                message.error('??????????????????')
            } else {
                message.success('??????????????????')
            }
            setUpdateStatus(false)
            console.log('update dst', 'err', err, 'data', data, 'stderr', stderr)
        })
    }

    const createBackupOnClick = () => {
        setCreateBackupStatus(true)
        message.success('????????????????????????')
        createBackupApi("")
            .then(response => {
                message.success('????????????????????????')
            })
            .catch(error => {
                console.log('error', error);
                message.error('????????????????????????')

            })
            .finally(() => {
                setCreateBackupStatus(false)
            })
    }

    const openGameDir =()=>{
        const config = readDstConfigSync()
        const dirPath = window.require('path').join(config.doNotStarveTogether, config.cluster)
        openDir(dirPath)
    }

    return (
        <>
            <Card
                title="????????????"
                bordered={false}
            >
                <Form
                    labelCol={{
                        span: 6,
                    }}
                    wrapperCol={{
                        span: 14,
                    }}
                    layout="horizontal"
                    labelAlign={'left'}
                >
                    <Form.Item label="????????????">
                        <Space>
                            <Button
                                onClick={launchOnClick}
                                type='primary' >{'????????????'}
                            </Button>

                            <Button
                                onClick={openGameDir}
                            >{'????????????'}
                            </Button>
                        </Space>
                    </Form.Item>

                    {mode && (<Form.Item label="????????????">
                        <Space>
                            <Button type="primary"
                                onClick={() => { updateGameOnclick() }}
                                loading={updateGameStatus}
                            >
                                ????????????
                            </Button>
                        </Space>
                    </Form.Item>)}

                    <Form.Item label="????????????" >
                        <CleanArchive />
                    </Form.Item>

                    <Form.Item label="????????????">
                        <Space>
                            {/* <Button onClick={()=>setIsModalOpen(true)}>????????????</Button> */}
                            <RestoreBackup />
                            <Button style={{
                                margin: '0 8px',
                                background: '#13CE66',
                                color: '#fff'
                            }}
                                onClick={() => { createBackupOnClick() }}
                                loading={createBackupStatus}
                            >
                                ????????????
                            </Button>
                        </Space>

                    </Form.Item>
                </Form>
            </Card>
        </>
    )
}

export default GameStatus