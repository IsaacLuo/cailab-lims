import * as React from 'react'
import { Table, Input, Loading, DatePicker, Tag, Button, Notification } from 'element-react'
import Dropzone from 'react-dropzone'
import styled from 'styled-components'

// router 
import { Link } from 'react-router-dom'
// redux
import { IStoreState } from './store'
import { Dispatch } from 'redux'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { ActionSetUploadPartsDialogVisible, ActionClearLoginInformation } from './actions'

// helpers
import { serverURL } from './config'
import getAuthHeader from './authHeader'
import * as xlsx from 'xlsx'
import {readFileAsBuffer,readFileAsDataURL, PartFormReader, readFileAsBase64} from './tools'
import {IColumn, IAttachment} from './types'
import axios from 'axios';
import NewPartDialog from './NewPartDialog';

const MyPanel = styled.div`
  display:flex;
  flex-direction: column;
  align-items: center;
`
const MyDropzone = styled(Dropzone)`
  width:300px;
  height:200px;
  display:flex;
  border: solid 1px #000;
`
const MiniDropzone = styled(Dropzone)`
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
    }
  }  
  public render() {
    const {sampleType} = this.props;
    const {partsForm, formTitles, submitting} = this.state;
    return (
      <MyPanel>
        {partsForm.length === 0 ? 
        <div>
          <div>only modified xlsx from the <a href={`${serverURL}/public/bacterium_template.xlsx`}>template</a></div>
          <MyDropzone
            maxSize = {10*1024*1024}
            accept = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            multiple = {false}
            onDrop={this.onDropFiles}
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
              drag and drop xlsx file to here or click
            </DropzopnHint>
          </MyDropzone>
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
            </div>
          }
        </div>
        }
      </MyPanel>
    )
  }

  private clearParts = () => {
    this.setState({partsForm: []});
  }
  private onDropFiles = async (acceptedFiles:File[]) => {
    if (acceptedFiles && acceptedFiles[0]) {
      const excelFile = acceptedFiles[0];
      const data = await readFileAsBuffer(excelFile);
      const workbook = xlsx.read(data, {type:'buffer'});
      console.log(workbook);
      const partFormReader = PartFormReader.fromWorkBook(workbook);
      const partsForm = partFormReader.readData();
      const partsFormUI = partsForm.map(val=>({submitting:'ready', readingAttachment: false} as IRowUIControl));
      this.setState({
        formTitles: [
          {label:'status', prop:'tags', width:200, fixed: 'left', render: (row)=><span>
            {row.submitStatus === 'OK' ? 
              <GreenText>saved {`${row.labName}:${row.personalName}`}</GreenText> : 
              <div>
                {row.submitStatus === 'ready' ? 
                <span>ready to submit</span>: 
                <RedText>failed</RedText>}
              </div>
            }
          </span>}, 

          ...partFormReader.getHeaders().map(val => {
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
                <div key={key}>{item.name}:{item.size}</div>
                ):
              <div>'no attachments'</div>)
          :
          <Loading loading={this.state.partsFormUI[index].readingAttachment}>
          <MiniDropzone
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
              {row.attachments.length > 0 &&
                row.attachments.map((item, key)=>
                  <div key={key}>{item.name}:{item.size}</div>
                  )
              }
              <Button type="text" size="mini" style={{marginLeft: 5}}>
                  add <i className="el-icon-plus el-icon-right"/>
              </Button>
            </DropzopnHint>
          </MiniDropzone>
          </Loading>}
        </span>}, 

        ],
        partsForm,
        partsFormUI,
      });
    }
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
    this.setState({submitting: 'submitting'});
    let failedCount:number = 0;
    for(const newPartForm of this.state.partsForm) {
      if (newPartForm.submitStatus !== 'OK') {
        newPartForm.sampleType = this.props.sampleType;
        try {
          const res = await axios.post(serverURL+'/api/part', newPartForm, getAuthHeader());
          newPartForm.labName = res.data.labName;
          newPartForm.personalName = res.data.personalName;
          newPartForm.submitStatus = 'OK';
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
            }
          } else {
            // no response
            Notification.error({
              title: 'error',
              message: err
            });
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
}

const mapStateToProps = (state :IStoreState) => ({

})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  hideDialog: () => dispatch(ActionSetUploadPartsDialogVisible(false)),
  logout: () => dispatch(ActionClearLoginInformation()),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(UploadPartsDialog))
