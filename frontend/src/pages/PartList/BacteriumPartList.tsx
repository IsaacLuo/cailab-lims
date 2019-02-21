/**
 * partList
 */

// types
import {
  IStoreState,
  IBasket,
  IReactRouterProps,
  IUserInfo,
  IColumn,
  IPartListRowData,
  IPart,
} from 'types'

// react
import * as React from 'react'
import axios from 'axios'
import qs from 'qs'

// redux
import { Dispatch } from 'redux'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import {
  ActionSetNewPartDialogVisible,
  ActionSetEditPartDialogVisible,
} from 'actions/appActions'
import {
  GET_DEFAULT_BASKET,
  GET_PARTS,
  SET_SKIP,
  SET_LIMIT,
  SET_SEARCH_KEYWORD,
  SET_USER_FILTER,
  SET_SORT_METHOD,
  EXPORT_TO_XLSX,
  } from './actions';

// react-router
import {Redirect} from 'react-router'
import {Link} from 'react-router-dom'

// helpers
import { serverURL } from 'config'
import getAuthHeader from 'authHeader'
import {fileSizeHumanReadable, toPlural} from 'tools'

// components
import {
  Pagination,
  Loading,
  Select,
  Button,
  MessageBox,
  Message,
  Table,
  Input,
} from 'element-react'
import styled from 'styled-components'
import ErrorBoundary from 'components/ErrorBoundary'
import EditPartDialog from 'components/EditPartDialog';
import {
  IProps,
  IState,
  mapStateToProps,
  mapDispatchToProps,
  PartList
} from 'pages/PartList';


const MyClickableIcon = styled(Button)`
  &+&{
    margin-left: 0px;
  }
`;

const FullWidthTable = styled(Table)`
  width: 100%;
`

interface IExpandedPanel {
  type: string,
  expandPannel?: (data:any) => JSX.Element,
}

class BacteriumPartList extends PartList {
  constructor(props) {
    super(props);
  }

  protected getTitle () {
    return 'bacteria'
  }

  protected getSampleType () {
    return 'bacterium'
  }
  
  protected generateColumnTitle() :Array<IColumn|IExpandedPanel> {
    const {userId} = this.props;
    return [
      {
        type: 'selection',
      },
      this.generateExpandTablePanel(),
      {
        label: "lab name",
        prop: "labName",
        sortable: "custom",
        width:100,
        render: (data) => <div>
          <Link to={`/part/${data._id}`}>{data.labName}</Link>
        </div>,
      },
      {
        label: "personal name",
        prop: "personalName",
        sortable: "custom",
        width:100,
        render: (data) => <div>
          <Link to={`/part/${data._id}`}>{data.personalName}</Link>
        </div>,
      },
      {
        label: "other names",
        prop: "tags",
        sortable: "custom",
        width:200,
        render: (data) =>
          <div style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>{this.format(data.tags)}</div> 
      },
      {
        label: "host strain",
        prop: "hostStrain",
        sortable: "custom",
        width: 180,
      },
      {
        label: "comment",
        prop: "comment",
        sortable: "custom",
        minWidth: 200,
        render: (row, column, index) =>
          <div style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>{row.comment}</div> 
      },
      {
        label: "markers",
        prop: "markers",
        sortable: "custom",
        width: 120,
        render: (data) =>
          <div style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>{this.format(data.tags)}</div> 
      },
      {
        label: "date",
        prop: "date",
        sortable: "custom",
        width: 180,
        render: (data) => (new Date(data.createdAt).toLocaleDateString()),
      },
      {
        label: "...",
        prop: "attachments",
        width: 100,
        render: (row, column, index) =>
        <div>
          {row.attachments&& row.attachments[0] &&
            (<a
              onClick={this.onClickAttachment.bind(this,row.attachments[0].fileId, row.attachments[0].fileName)}
            >
              <MyClickableIcon type="text" icon="document"/>
            </a>)
          }
          {row.ownerId === userId && <MyClickableIcon type="text" icon="edit" onClick={this.onClickEditPart.bind(this, row)} />}
          {row.ownerId === userId && <MyClickableIcon type="text" icon="delete2" onClick={this.onClickDeletePart.bind(this, row)} />}
        </div>
      }
      ];
    }
    
  protected getUploadURL():string|undefined {
    return '/parts/bacteria/upload/'
  }
}



export default withRouter(connect(mapStateToProps, mapDispatchToProps)(BacteriumPartList))
