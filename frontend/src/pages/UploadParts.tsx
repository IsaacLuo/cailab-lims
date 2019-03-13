import {IColumn, IAttachment, IStoreState} from 'types'
import * as React from 'react'
import { Input, Loading, DatePicker, Tag, Button, Notification } from 'element-react'
import Dropzone from 'react-dropzone'
import {useDropzone} from 'react-dropzone'
import styled from 'styled-components'
import {Table} from 'element-react'

// router 
import { Link } from 'react-router-dom'
// redux
import { Dispatch } from 'redux'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { ActionSetUploadPartsDialogVisible} from 'actions/appActions'
import { ActionClearLoginInformation } from 'actions/userActions'

// helpers
import { serverURL } from '../config'
import getAuthHeader from '../authHeader'
import * as xlsx from 'xlsx'
import {readFileAsBuffer,readFileAsDataURL, PartFormReader} from '../tools'

import axios from 'axios';
// import NewPartDialog from 'components/NewPartDialog';

const MyPanel = styled.div`
  display:flex;
  flex-direction: column;
  align-items: center;
`
const DropzoneContainer = styled.div`
  width:300px;
  height:200px;
  display:flex;
  border: solid 1px #000;
`
const MiniDropzoneContainer = styled.div`
  width:100%;
  border: solid 1px rgba(0,0,0,0.01);
  box-sizing: border-box;
`

const DropzopnHint = styled.div`
  display:flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
`
const GreenText = styled.span`
  color: green;
`
const RedText = styled.span`
  color: red;
`

interface IRowUIControl {
  // submitting: 'ready'|'submitting'|'done'|'failed',
  readingAttachment: boolean,
}

interface IProps {
  sampleType: string,
  returnTo?: string,
  hideDialog: () => void,
  logout: () => void,
}

interface IState {
  partsForm: any[],
  partsFormUI: IRowUIControl[],
  formTitles: IColumn[],
  uploadingAttachments: boolean,
  submitting: 'ready'|'submitting'|'done'|'failed',
  sucessefulCount: number,
  failedCount: number,
}

class UploadPartsDialog extends React.Component<IProps, IState> {
  public tagInputRef:React.RefObject<Input> = React.createRef()

  constructor(props:IProps) {
    super(props);
    this.state = {
      partsForm: [],
      formTitles: [],
      partsFormUI: [],
      submitting: 'ready',
      uploadingAttachments: false,
      sucessefulCount: 0,
      failedCount: 0,
    }
  }

  public render() {
    const {sampleType} = this.props;
    const {partsForm, formTitles, submitting} = this.state;
    return (
      <MyPanel>
        {partsForm.length === 0 ? 
        <div>
          <div>only modified xlsx from the <a href={`${serverURL}/public/${sampleType}_template.xlsx`}>template</a></div>
          <this.UploadPartsDropzone />
            {/* // maxSize = {10*1024*1024}
            // accept = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            // multiple = {false}
            // onDrop={this.onDropFiles}
            // rejectStyle={{
            //   borderColor:'#f00',
            //   backgroundColor:'#f77',
            // }}
            // acceptStyle={{
            //   borderColor:'#0f0',
            //   backgroundColor:'#7f7',
            // }}
            // >
            // {({getRootProps, getInputProps}) => (
            //     <DropzopnHint>
            //       drag and drop xlsx file to here or click
            //     </DropzopnHint>
            // )} */}
            
          
        </div>
        :
        <div style={{width:'100%'}}>
          <Table
            style={{width: '100%'}}
            columns={formTitles}
            data={partsForm}
          />
          {
            submitting === 'done' ?
            <div>
              {this.props.returnTo && <Link to={this.props.returnTo}><Button>close</Button></Link>}
            </div> 
            :
            <div>
            <Button onClick={this.submitParts} disabled={submitting === 'submitting'}> {submitting ==='submitting' ? 'submitting' : 'submit'} </Button>
            <Button onClick={this.clearParts} disabled={submitting === 'submitting'}> clear </Button>
            {
              submitting === 'submitting' &&
              <div>
                {this.state.sucessefulCount} submitted, {this.state.failedCount} failed <i className="el-icon-loading" />
              </div>
            }
            </div>
          }
        </div>
        }
      </MyPanel>
    )
  }

  UploadPartsDropzone = (props) => {
    const {
      getRootProps,
      getInputProps,
      isDragActive,
      isDragAccept,
      isDragReject,
    } = useDropzone({
      accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      multiple: false,
      onDrop: this.onDropFiles,
      })
    
    return (
      <DropzoneContainer {...getRootProps({isDragActive, isDragAccept, isDragReject})}>
        <input {...getInputProps()} />
        <p>Drag 'n' drop some files here, or click to select files</p>
      </DropzoneContainer>
    )
  }

  MiniDropzone = (props) => {
    const {
      getRootProps,
      getInputProps,
      isDragActive,
      isDragAccept,
      isDragReject,
    } = useDropzone({
      maxSize: 10*1024*1024,
      onDrop: this.onDropAttachments.bind(this, props.index, props.attachments),
      multiple: true
      })
    
    return (
      <MiniDropzoneContainer {...getRootProps({isDragActive, isDragAccept, isDragReject})}>
        <input {...getInputProps()} />
        <DropzopnHint>
          <Button type="text" size="mini" style={{marginLeft: 5}}>
              add <i className="el-icon-plus el-icon-right"/>
          </Button>
        </DropzopnHint>
      </MiniDropzoneContainer>
    )
  }

  private clearParts = () => {
    this.setState({partsForm: []});
  }
  private onDropFiles = async (acceptedFiles:File[]) => {
    console.log(acceptedFiles,'acc')
    if (acceptedFiles && acceptedFiles[0]) {
      try {
        const excelFile = acceptedFiles[0];
        const data = await readFileAsBuffer(excelFile);
        const workbook = xlsx.read(data, {type:'buffer'});
        console.log(workbook);
        const partFormReader = PartFormReader.fromWorkBook(workbook);
        const partsForm = partFormReader.readData();
        console.debug('data read', partsForm);
        if (partsForm.length === 0) {
          throw new Error('empty form');
        }
        const partsFormUI = partsForm.map(val=>({submitting:'ready', readingAttachment: false} as IRowUIControl));
        const headers = partFormReader.getHeaders();
        if (this.verifyHeaders(headers)) {
          this.setState({
            formTitles: [
              {label:'status', prop:'tags', width:200, fixed: 'left', render: (row)=><span>
                {row.submitStatus === 'OK' ? 
                  <GreenText>saved {`${row.labName}:${row.personalName}`}</GreenText> : 
                  <div>
                    {row.submitStatus === 'failed' ? 
                    <RedText>failed</RedText>:
                    <span>{row.submitStatus}</span>}
                  </div>
                }
              </span>}, 

              ...headers.map(val => {
              if (val === 'date'){
                return {label:val, prop: val, width:200, render: (row) => 
                  <span>
                    {row.date.toLocaleDateString()}
                  </span>
                }
              } else {
                return {label:val, prop: val, width:200};
              }
            }),

            {label:'attachments', prop:'tags', width:200, fixed: 'left', render: (row, column, index)=><span>
              {row.submitStatus === 'OK' ? 
                  (row.attachments.length > 0?
                  row.attachments.map((item, key)=>
                    <div key={key}>
                      <span>{item.name}:{item.size}</span>
                    </div>
                    ):
                  <div>'no attachments'</div>)
              :
              <Loading loading={this.state.partsFormUI[index].readingAttachment}>
                {row.attachments.length > 0 &&
                    row.attachments.map((item, key)=>
                      <div key={key}>
                      <span>{item.name}:{item.size}</span>
                      <Button type="text" size="mini" onClick={this.onDeleteAttachment.bind(this, row.attachments, index)} style={{marginLeft: 5}}>
                        <i className="el-icon-delete" />
                      </Button>
                      </div>
                      )
                  }
              <this.MiniDropzone
                index = {index}
                attachments = {row.attachments}
              />
              {/* <MiniDropzone
                maxSize={10*1024*1024}
                onDrop={this.onDropAttachments.bind(this, index, row.attachments)}
                rejectStyle={{
                  borderColor:'#f00',
                  backgroundColor:'#f77',
                }}
                acceptStyle={{
                  borderColor:'#0f0',
                  backgroundColor:'#7f7',
                }}
                >
                <DropzopnHint>
                  <Button type="text" size="mini" style={{marginLeft: 5}}>
                      add <i className="el-icon-plus el-icon-right"/>
                  </Button>
                </DropzopnHint>
              </MiniDropzone> */}
              </Loading>}
            </span>}, 

            ],
            partsForm,
            partsFormUI,
          }, ()=>{console.log({state:this.state,form:partsForm})});
        } else {
          throw new Error('headers doesn\'t match sampleType');
        }
      } catch (err) {
        console.error(err);
        Notification.error({
          title: `bad format`,
          message: `Unable to read this file as a ${this.props.sampleType} form`,
        });
      }
    }
  }

  private onDeleteAttachment = (attachments: string[], index: number) => {
    attachments.splice(index, 1);
    this.forceUpdate();
  }

  private onDropAttachments = async (index: number, storage: IAttachment[], acceptedFiles:File[], rejectedFiles: File[]) => {
    if (rejectedFiles.length > 0) {
      const rejectedFileNames = rejectedFiles.map(val=> val.name);
      Notification.error({
        title: `rejected`,
        message: rejectedFileNames.join(' '),
      });
    }
    const {partsFormUI} = this.state;
    partsFormUI[index].readingAttachment = true;
    this.setState({uploadingAttachments: true});
    // await this.asyncSetState({uploadingAttachments: true});
    for(const attachment of acceptedFiles) {
      const attachmentContent:string = await readFileAsDataURL(attachment);
      storage.push({
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
        content:attachmentContent});
    }
    partsFormUI[index].readingAttachment = false;
    this.setState({uploadingAttachments: false});
  }

  private submitParts = async () => {
    let sucessefulCount:number = 0;
    let failedCount:number = 0;

    this.setState({submitting: 'submitting', sucessefulCount, failedCount});

    for(const newPartForm of this.state.partsForm) {
      if (newPartForm.submitStatus !== 'OK') {
        newPartForm.sampleType = this.props.sampleType;
        try {
          newPartForm.submitStatus = 'submitting';
          // create a new part
          const res = await axios.post(serverURL+'/api/part', newPartForm, getAuthHeader());
          newPartForm.labName = res.data.labName;
          newPartForm.personalName = res.data.personalName;
          newPartForm.submitStatus = 'OK';
          sucessefulCount++;
          this.setState({sucessefulCount});
        } catch (err) {
          newPartForm.submitStatus = 'failed';
          if (err.response) {
            if (err.response.status === 401) {
            this.props.logout();
            } else {
              console.error(err.response.status, err.response.data);
              Notification.error({
                title: `error: ${err.response.status}`,
                message:  err.response.statusText,
              });
              failedCount++;
              this.setState({sucessefulCount});
            }
          } else {
            // no response
            Notification.error({
              title: 'error',
              message: err
            });
            failedCount++;
            this.setState({sucessefulCount});
          }
        }
      }
    }
    if (failedCount === 0) {
      this.setState({submitting: 'done'});
    } else {
      this.setState({submitting: 'failed'});
    }
  }

  private asyncSetState(state: any) {
    this.setState(state, ()=>new Promise((resolve, reject)=>{resolve();}));
  }

  private verifyHeaders(headers: string[]) {
    console.log('verify headers', headers);
    const {sampleType} = this.props;
    let necessaryHeaders:string[] = [];
    switch(sampleType) {
      case 'bacterium':
        necessaryHeaders = ['plasmidName','tags','comment','date','hostStrain'];
        break;
      case 'primer':
      case 'yeast':
    }
    for(const header of necessaryHeaders) {
      if (headers.indexOf(header)<0) {
        return false;
      }
    }
    return true;
  }
}

const mapStateToProps = (state :IStoreState) => ({

})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  hideDialog: () => dispatch(ActionSetUploadPartsDialogVisible(false)),
  logout: () => dispatch(ActionClearLoginInformation()),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(UploadPartsDialog))
