// Pi Network SDK 初始化
const piSDK = window.piBrowserSDK || {
    // 模拟SDK，用于开发测试
    authenticate: () => Promise.resolve({ user: { uid: 'test_user_123', username: 'TestUser' } }),
    signOut: () => Promise.resolve(),
    init: () => Promise.resolve()
};

// 应用状态管理
class VotingApp {
    constructor() {
        this.currentUser = null;
        this.projects = [];
        this.userVotes = [];
        this.userPoints = 1000; // 初始积分
        this.pointsHistory = []; // 积分历史记录
        this.hiddenProjects = []; // 用户隐藏的项目列表
        this.init();
    }

    async init() {
        try {
            // 初始化 Pi SDK
            if (typeof piSDK.init === 'function') {
                await piSDK.init();
            }
            
            // 加载本地数据
            this.loadLocalData();
            
            // 初始化UI
            this.initializeUI();
            
            // 渲染项目列表
            this.renderProjects();
            
            console.log('应用初始化完成');
        } catch (error) {
            console.error('应用初始化失败:', error);
        }
    }

    // 加载本地存储数据
    loadLocalData() {
        try {
            // 加载项目数据
            const savedProjects = localStorage.getItem('voting_projects');
            if (savedProjects) {
                this.projects = JSON.parse(savedProjects);
                // 确保所有项目都有必要的属性
                this.projects.forEach(project => {
                    if (!project.voteDetails) {
                        project.voteDetails = [];
                    }
                    if (!project.votes) {
                        project.votes = { yes: 0, no: 0 };
                    }
                });
            }

            // 加载用户投票记录
            const savedVotes = localStorage.getItem('user_votes');
            if (savedVotes) {
                this.userVotes = JSON.parse(savedVotes);
            }

            // 加载用户积分
            const savedPoints = localStorage.getItem('user_points');
            if (savedPoints) {
                const points = parseInt(savedPoints);
                this.userPoints = isNaN(points) ? 1000 : points;
            }

            // 加载积分历史记录
            const savedHistory = localStorage.getItem('points_history');
            if (savedHistory) {
                this.pointsHistory = JSON.parse(savedHistory);
            }

            // 加载用户信息
            const savedUser = localStorage.getItem('current_user');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
                this.updateLoginButton();
            }

            // 加载隐藏项目列表
            const savedHiddenProjects = localStorage.getItem('hidden_projects');
            if (savedHiddenProjects) {
                this.hiddenProjects = JSON.parse(savedHiddenProjects);
            }
        } catch (error) {
            console.error('加载本地数据失败:', error);
        }
    }

    // 保存数据到本地存储
    saveLocalData() {
        try {
            localStorage.setItem('voting_projects', JSON.stringify(this.projects));
            localStorage.setItem('user_votes', JSON.stringify(this.userVotes));
            localStorage.setItem('user_points', this.userPoints.toString());
            localStorage.setItem('points_history', JSON.stringify(this.pointsHistory));
            localStorage.setItem('hidden_projects', JSON.stringify(this.hiddenProjects));
            if (this.currentUser) {
                localStorage.setItem('current_user', JSON.stringify(this.currentUser));
            }
        } catch (error) {
            console.error('保存数据失败:', error);
        }
    }

    // 初始化UI事件
    initializeUI() {
        // 创建项目表单提交
        const createForm = document.getElementById('createProjectForm');
        if (createForm) {
            createForm.addEventListener('submit', (e) => this.handleCreateProject(e));
        }

        // 提现表单提交
        const withdrawForm = document.getElementById('withdrawForm');
        if (withdrawForm) {
            withdrawForm.addEventListener('submit', (e) => this.handleWithdraw(e));
        }

        // 设置最小截止时间为当前时间
        const endTimeInput = document.getElementById('endTime');
        if (endTimeInput) {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            endTimeInput.min = now.toISOString().slice(0, 16);
        }

        // 项目标题输入框不再限制输入，只在提交时验证
    }

    // 处理登录/退出
    async handleLogin() {
        try {
            if (this.currentUser) {
                // 退出登录
                await piSDK.signOut();
                this.currentUser = null;
                localStorage.removeItem('current_user');
                this.updateLoginButton();
                this.renderProjects();
                alert('已退出登录');
            } else {
                // 登录
                const authResult = await piSDK.authenticate();
                if (authResult && authResult.user) {
                    const isNewUser = !this.currentUser;
                    this.currentUser = authResult.user;
                    
                    // 如果是新用户且没有积分历史记录，添加初始积分记录
                    if (isNewUser && this.pointsHistory.length === 0) {
                        this.addPointsHistory('initial', 1000, '新用户注册奖励');
                    }
                    
                    this.saveLocalData();
                    this.updateLoginButton();
                    this.renderProjects();
                    alert(`欢迎，${this.currentUser.username || this.currentUser.uid}！`);
                }
            }
        } catch (error) {
            console.error('登录操作失败:', error);
            alert('登录操作失败，请重试');
        }
    }

    // 添加积分历史记录
    addPointsHistory(type, points, description) {
        const historyItem = {
            id: Date.now(),
            type: type,
            points: points || 0,
            description: description,
            timestamp: new Date().toISOString(),
            balance: isNaN(this.userPoints) ? 0 : this.userPoints
        };
        this.pointsHistory.unshift(historyItem); // 添加到数组开头
        
        // 限制历史记录数量，只保留最近100条
        if (this.pointsHistory.length > 100) {
            this.pointsHistory = this.pointsHistory.slice(0, 100);
        }
    }

    // 显示积分明细
    showPointsDetail() {
        const modal = document.getElementById('pointsDetailModal');
        const currentPointsDisplay = document.getElementById('currentPointsDisplay');
        const historyList = document.getElementById('pointsHistoryList');
        
        // 更新当前积分显示
        currentPointsDisplay.textContent = isNaN(this.userPoints) ? 0 : this.userPoints;
        
        // 清空历史记录列表
        historyList.innerHTML = '';
        
        if (this.pointsHistory.length === 0) {
            historyList.innerHTML = '<div class="no-history">暂无积分记录</div>';
        } else {
            this.pointsHistory.forEach(item => {
                const historyItem = document.createElement('div');
                historyItem.className = `history-item ${item.points >= 0 ? 'positive' : 'negative'}`;
                
                const formatTime = new Date(item.timestamp).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                historyItem.innerHTML = `
                    <div class="history-info">
                        <div class="history-type">${item.description}</div>
                        <div class="history-time">${formatTime}</div>
                    </div>
                    <div class="history-points ${item.points >= 0 ? 'positive' : 'negative'}">
                        ${item.points >= 0 ? '+' : ''}${item.points}
                    </div>
                `;
                
                historyList.appendChild(historyItem);
            });
        }
        
        // 显示模态框
        modal.style.display = 'block';
    }

    // 显示公布结果模态框
    showPublishResult(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
            alert('项目不存在');
            return;
        }
        
        if (project.creatorId !== this.currentUser.uid) {
            alert('只有项目创建者可以公布结果');
            return;
        }
        
        if (project.resultPublished) {
            alert('结果已经公布过了');
            return;
        }
        
        // 移除项目结束时间限制，允许有投票时就可以公布结果
        
        const modal = document.getElementById('publishResultModal');
        const content = document.getElementById('publishResultContent');
        
        const yesVotes = project.votes?.yes || 0;
        const noVotes = project.votes?.no || 0;
        const totalVotes = yesVotes + noVotes;
        
        content.innerHTML = `
            <div class="publish-result-info">
                <h3>${project.title}</h3>
                <p>投票统计：</p>
                <div class="vote-stats">
                    <div>是：${yesVotes} 积分</div>
                    <div>否：${noVotes} 积分</div>
                    <div>总计：${totalVotes} 积分</div>
                </div>
                <p>冻结积分：${project.frozenPoints || 0}</p>
                <p>请选择实际结果：</p>
                <div class="result-options">
                    <button class="btn-result" onclick="publishResult('${projectId}', 'yes')">是</button>
                    <button class="btn-result" onclick="publishResult('${projectId}', 'no')">否</button>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    // 公布项目结果并分配奖励
    publishProjectResult(projectId, result) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
            alert('项目不存在');
            return;
        }
        
        // 设置结果
        project.result = result;
        project.resultPublished = true;
        
        // 计算奖励分配
        let totalRewards = 0;
        const rewardDetails = [];
        
        // 计算投票正确的用户和额外奖励需求
        let correctVoters = [];
        let totalVotedPoints = 0; // 投票正确用户的总投票积分
        
        project.voteDetails.forEach(vote => {
            if (vote.option === result) {
                correctVoters.push({
                    voter: vote.voter,
                    originalPoints: vote.points
                });
                totalVotedPoints += vote.points;
            }
        });
        
        // 计算额外奖励：发起人冻结积分按投票比例分配
        let totalExtraRewards = 0;
        correctVoters.forEach(detail => {
            // 投票正确用户获得：原投票积分返还 + 按比例分配的发起人冻结积分
            const extraReward = totalVotedPoints > 0 ? Math.floor((detail.originalPoints / totalVotedPoints) * project.frozenPoints) : 0;
            detail.extraReward = extraReward;
            detail.totalReward = detail.originalPoints + extraReward; // 原积分返还 + 额外奖励
            totalExtraRewards += extraReward;
            totalRewards += detail.totalReward;
            rewardDetails.push(detail);
        });
        
        // 分配奖励
        rewardDetails.forEach(detail => {
            // 这里需要找到对应用户并增加积分
            // 由于当前只有一个用户系统，我们只处理当前用户
            if (detail.voter === this.currentUser.uid) {
                this.userPoints += detail.totalReward;
                this.addPointsHistory('vote_return', detail.originalPoints, 
                    `投票积分返还 - ${project.title}`);
                if (detail.extraReward > 0) {
                    this.addPointsHistory('vote_reward', detail.extraReward, 
                        `投票奖励 - ${project.title} (额外奖励${detail.extraReward}积分)`);
                }
            }
        });
        
        // 发起人的冻结积分处理
        if (project.creatorId === this.currentUser.uid) {
            // 如果当前用户是创建者，冻结积分已用于奖励分配
            this.addPointsHistory('project_reward_payout', -totalExtraRewards, 
                `项目奖励支出 - ${project.title} (冻结积分用于奖励)`);
            // 如果没有投票正确的用户，冻结积分返还给发起人
            if (correctVoters.length === 0) {
                this.userPoints += project.frozenPoints;
                this.addPointsHistory('project_refund', project.frozenPoints, 
                    `项目冻结积分返还 - ${project.title} (无正确投票)`);
            }
        }
        
        this.saveLocalData();
        this.updateUserPointsDisplay();
        this.renderProjects();
        
        closeModal('publishResultModal');
        alert(`结果公布成功！共分配奖励${totalRewards}积分给${rewardDetails.length}位投票正确的用户。`);
    }

    // 更新用户积分显示
    updateUserPointsDisplay() {
        const userPoints = document.getElementById('userPoints');
        if (userPoints && this.currentUser) {
            const points = isNaN(this.userPoints) ? 0 : this.userPoints;
            userPoints.textContent = `积分: ${points}`;
        }
    }

    // 更新登录按钮状态
    updateLoginButton() {
        const loginBtn = document.getElementById('loginBtn');
        const subtitle = document.getElementById('subtitle');
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');
        const userPoints = document.getElementById('userPoints');
        
        if (loginBtn) {
            if (this.currentUser) {
                loginBtn.textContent = '退出';
                loginBtn.className = 'btn btn-logout';
                
                // 隐藏副标题，显示用户信息
                if (subtitle) subtitle.style.display = 'none';
                if (userInfo) {
                    userInfo.style.display = 'flex';
                    if (userName) userName.textContent = this.currentUser.username || this.currentUser.uid;
                    if (userPoints) {
                        const points = isNaN(this.userPoints) ? 0 : this.userPoints;
                        userPoints.textContent = `积分: ${points}`;
                    }
                }
            } else {
                loginBtn.textContent = '登录';
                loginBtn.className = 'btn btn-login';
                
                // 显示副标题，隐藏用户信息
                if (subtitle) subtitle.style.display = 'block';
                if (userInfo) userInfo.style.display = 'none';
            }
        }
    }

    // 处理创建项目
    handleCreateProject(e) {
        e.preventDefault();
        
        if (!this.currentUser) {
            alert('请先登录');
            return;
        }

        const formData = new FormData(e.target);
        const title = document.getElementById('projectTitle').value.trim();
        const description = document.getElementById('projectDescription').value.trim();
        const endTime = document.getElementById('endTime').value;
        const maxPoints = parseInt(document.getElementById('maxPoints').value);

        // 验证表单
        if (!title || !description || !endTime || !maxPoints) {
            alert('请填写所有必填字段');
            return;
        }

        if (title.length > 11) {
            alert('项目标题不能超过11个字符');
            return;
        }

        if (description.length > 100) {
            alert('项目描述不能超过100个字符');
            return;
        }

        // 验证截止时间
        const endDate = new Date(endTime);
        if (endDate <= new Date()) {
            alert('截止时间必须晚于当前时间');
            return;
        }

        // 创建新项目（移除编辑功能）
        if (this.editingProjectId) {
            alert('编辑模式下无法创建新项目，请先取消编辑');
            return;
        }
        
        {
            // 创建新项目
            if (maxPoints > this.userPoints) {
                alert(`积分不足，当前积分：${this.userPoints}`);
                return;
            }

            const project = {
                id: Date.now().toString(),
                title,
                description,
                endTime,
                maxPoints,
                creatorId: this.currentUser.uid,
                creatorName: this.currentUser.username || this.currentUser.uid,
                createdAt: new Date().toISOString(),
                frozenPoints: parseInt(maxPoints), // 冻结的积分
                votes: {
                    yes: 0,
                    no: 0
                },
                voters: [],
                voteDetails: [], // 投票详情
                status: 'active',
                result: null, // 发起人公布的结果
                resultPublished: false // 是否已公布结果
            };

            // 冻结积分
            this.userPoints -= maxPoints;
            this.addPointsHistory('project_cost', -maxPoints, `创建项目 - ${title}`);
            
            // 添加项目
            this.projects.unshift(project);
            
            alert(`项目创建成功！已冻结${maxPoints}积分，当前积分：${this.userPoints}`);
        }

        // 保存数据并更新显示
        this.saveLocalData();
        this.updateUserPointsDisplay();

        // 重置表单
        e.target.reset();
        
        // 刷新显示
        console.log('项目创建后，当前项目数量:', this.projects.length);
        console.log('最新项目:', this.projects[0]);
        this.renderProjects();
    }

    // 处理投票
    handleVote(projectId, option, votePoints) {
        if (!this.currentUser) {
            alert('请先登录');
            return;
        }

        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
            alert('项目不存在');
            return;
        }

        // 允许多次投票，移除已投票检查

        // 检查项目是否已结束
        if (new Date(project.endTime) <= new Date()) {
            alert('投票已结束');
            return;
        }

        // 检查积分是否足够
        if (this.userPoints < votePoints) {
            alert(`积分不足，当前积分：${this.userPoints}`);
            return;
        }

        // 计算选中选项的剩余可投积分
        const currentVotes = project.votes[option] || 0;
        const remainingPoints = Math.max(0, project.maxPoints - currentVotes);
        
        // 检查投票积分是否超过该选项的剩余积分
        if (votePoints > remainingPoints) {
            alert(`该选项剩余可投积分不足，最多可投${remainingPoints}积分`);
            return;
        }
        
        // 检查投票积分是否超过项目限制
        if (votePoints > project.maxPoints) {
            alert(`投票积分不能超过${project.maxPoints}`);
            return;
        }

        // 记录投票
        const vote = {
            projectId,
            userId: this.currentUser.uid,
            option,
            points: votePoints,
            timestamp: new Date().toISOString()
        };

        this.userVotes.push(vote);
        project.votes[option] += votePoints;
        project.voters.push(this.currentUser.uid);
        
        // 记录投票详情
        project.voteDetails.push({
            voter: this.currentUser.uid,
            option: option,
            points: votePoints,
            timestamp: new Date().toISOString()
        });
        
        // 扣除投票积分
        this.userPoints -= votePoints;
        this.addPointsHistory('vote_cost', -votePoints, `投票 - ${project.title} (${option === 'yes' ? '是' : '否'}, ${votePoints}积分)`);
        
        this.saveLocalData();
        this.updateUserPointsDisplay();
        this.renderProjects();
        
        alert(`投票成功！已扣除${votePoints}积分，当前积分：${this.userPoints}`);
        closeModal('voteModal');
    }

    // 处理提现
    handleWithdraw(e) {
        e.preventDefault();
        
        if (!this.currentUser) {
            alert('请先登录');
            return;
        }

        const address = document.getElementById('withdrawAddress').value.trim();
        const amount = parseInt(document.getElementById('withdrawAmount').value);

        if (!address || !amount) {
            alert('请填写所有字段');
            return;
        }

        // 验证Pi Network地址格式（简单验证）
        if (!this.validatePiAddress(address)) {
            alert('请输入有效的Pi Network地址');
            return;
        }

        if (amount <= 0) {
            alert('提现金额必须大于0');
            return;
        }

        const fee = Math.ceil(amount * 0.1); // 10%手续费
        const totalDeduction = amount + fee;

        if (totalDeduction > this.userPoints) {
            alert(`积分不足，需要${totalDeduction}积分（含10%手续费），当前积分：${this.userPoints}`);
            return;
        }

        // 扣除积分
        this.userPoints -= totalDeduction;
        this.addPointsHistory('withdraw', -totalDeduction, `提现 ${amount} 积分 (含手续费 ${fee})`);
        this.saveLocalData();
        this.updateUserPointsDisplay();

        // 重置表单
        e.target.reset();
        closeModal('withdrawModal');
        
        alert(`提现申请已提交！\n提现金额：${amount}\n手续费：${fee}\n预计1小时内到账`);
    }

    // 验证Pi Network地址
    validatePiAddress(address) {
        // 简单的地址格式验证
        return address.length >= 20 && /^[A-Za-z0-9]+$/.test(address);
    }

    // 渲染项目列表
    renderProjects() {
        this.renderAllProjects();
        this.renderMyProjects();
    }

    // 渲染所有项目
    renderAllProjects() {
        const container = document.getElementById('projectsList');
        if (!container) return;

        // 只显示进行中且未公布结果的项目，按创建时间倒序排列
        const allProjects = [...this.projects]
            .filter(project => {
                const isActive = new Date(project.endTime) > new Date();
                return isActive && !project.resultPublished;
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (allProjects.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7);">暂无项目</p>';
            return;
        }

        container.innerHTML = allProjects.map(project => {
            const endDate = new Date(project.endTime).toLocaleString('zh-CN');
            const isActive = new Date(project.endTime) > new Date();
            
            // 计算参与人次（不重复计算同一用户）
            const participantCount = [...new Set(project.voteDetails?.map(vote => vote.voter) || [])].length;
            
            return `
                <div class="project-item">
                    <div class="project-title">${project.title} <span style="color: #dc3545; position: absolute; top: 10px; right: 10px; font-size: 12px; font-weight: bold;">[${isActive ? '进行中' : '已结束'}]</span></div>
                    <div class="project-description">${project.description}</div>
                    <div class="project-meta">
                        <span>截止：${endDate}</span>
                        <span>参与人次：${participantCount}人</span>
                    </div>
                    <div class="project-actions">
                        <button class="btn-vote" onclick="showVoteModal('${project.id}')">投票</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 渲染我的项目
    renderMyProjects() {
        if (!this.currentUser) {
            document.getElementById('createdProjects').innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7);">请先登录</p>';
            document.getElementById('participatedProjects').innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7);">请先登录</p>';
            return;
        }

        // 我创建的项目（过滤掉隐藏的项目）
        const createdProjects = this.projects.filter(p => {
            const isMyProject = p.creatorId === this.currentUser.uid;
            const hiddenKey = `${this.currentUser.uid}_${p.id}`;
            const isHidden = this.hiddenProjects.includes(hiddenKey);
            return isMyProject && !isHidden;
        });
        const createdContainer = document.getElementById('createdProjects');
        
        if (createdProjects.length === 0) {
            createdContainer.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7);">您还没有创建任何项目</p>';
        } else {
            createdContainer.innerHTML = createdProjects.map(project => {
                const totalVotes = (project.votes?.yes || 0) + (project.votes?.no || 0);
                const endDate = new Date(project.endTime).toLocaleString('zh-CN');
                const isActive = new Date(project.endTime) > new Date();
                
                // 计算参与人数（不重复计算同一用户）
                const participantCount = [...new Set(project.voteDetails?.map(vote => vote.voter) || [])].length;
                
                // 判断项目状态和背景颜色
                const isResultPublished = project.resultPublished;
                const hasVotes = totalVotes > 0;
                const isInProgress = isActive && !isResultPublished;
                
                // 设置背景颜色：已公布结果为灰色，进行中为红色
                const backgroundColor = isResultPublished ? 'rgba(128, 128, 128, 0.3)' : (isInProgress ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.1)');
                
                return `
                    <div class="project-item" style="background: ${backgroundColor};">
                        <div class="project-title">${project.title} <span style="color: #dc3545; position: absolute; top: 10px; right: 10px; font-size: 12px; font-weight: bold;">[${isActive ? '进行中' : '已结束'}]</span></div>
                        <div class="project-description">${project.description}</div>
                        <div class="project-meta">
                            <span>截止：${endDate}</span>
                        </div>
                        <div class="project-meta">
                            <span>是：${project.votes?.yes || 0}票</span>
                            <span>否：${project.votes?.no || 0}票</span>
                            <span>参与人数：${participantCount}人</span>
                        </div>
                        ${project.resultPublished ? `<span class="result-published">项目结果: ${project.result === 'yes' ? '是' : '否'}</span>` : ''}
                        <div class="project-actions">
                            ${(totalVotes === 0 || project.resultPublished) ? `<button class="btn-delete" onclick="deleteProject('${project.id}')">删除</button>` : ''}
                            ${!project.resultPublished && totalVotes > 0 ? `<button class="btn-publish" onclick="showPublishResultModal('${project.id}')">公布结果</button>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }

        // 我参与的项目
        const participatedProjectIds = [...new Set(this.userVotes
            .filter(vote => vote.userId === this.currentUser.uid)
            .map(vote => vote.projectId))];
        
        const participatedProjects = this.projects.filter(p => {
            const isParticipated = participatedProjectIds.includes(p.id);
            const hiddenKey = `${this.currentUser.uid}_${p.id}`;
            const isHidden = this.hiddenProjects.includes(hiddenKey);
            return isParticipated && !isHidden;
        });
        
        const participatedContainer = document.getElementById('participatedProjects');
        
        if (participatedProjects.length === 0) {
            participatedContainer.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7);">您还没有参与任何投票</p>';
        } else {
            participatedContainer.innerHTML = participatedProjects.map(project => {
                const myVotes = this.userVotes.filter(vote => 
                    vote.projectId === project.id && vote.userId === this.currentUser.uid
                );
                const endDate = new Date(project.endTime).toLocaleString('zh-CN');
                const isActive = new Date(project.endTime) > new Date();
                
                // 统计我的投票
                const myYesVotes = myVotes.filter(v => v.option === 'yes').reduce((sum, v) => sum + v.points, 0);
                const myNoVotes = myVotes.filter(v => v.option === 'no').reduce((sum, v) => sum + v.points, 0);
                const myTotalVotes = myVotes.length;
                
                // 计算参与人次（不重复计算同一用户）
                const participantCount = [...new Set(project.voteDetails?.map(vote => vote.voter) || [])].length;
                
                // 判断项目状态和背景颜色
                const isResultPublished = project.resultPublished;
                const totalVotes = (project.votes?.yes || 0) + (project.votes?.no || 0);
                const isInProgress = isActive && !isResultPublished;
                
                // 设置背景颜色：已公布结果为灰色，进行中为红色
                const backgroundColor = isResultPublished ? 'rgba(128, 128, 128, 0.3)' : (isInProgress ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.1)');
                
                return `
                    <div class="project-item" style="background: ${backgroundColor};">
                        <div class="project-title">${project.title} <span style="color: #dc3545; position: absolute; top: 10px; right: 10px; font-size: 12px; font-weight: bold;">[${isActive ? '进行中' : '已结束'}]</span></div>
                        <div class="project-description">${project.description}</div>
                        <div class="project-meta">
                            <span>截止：${endDate}</span>
                            <span>参与人次：${participantCount}人</span>
                        </div>
                        <div class="project-meta">
                            <span>我的投票次数：${myTotalVotes}次</span>
                        </div>
                        <div class="project-meta">
                            <span>我投"是"：${myYesVotes}积分</span>
                            <span>我投"否"：${myNoVotes}积分</span>
                        </div>
                        ${project.resultPublished ? `<span class="result-published">项目结果: ${project.result === 'yes' ? '是' : '否'}</span>` : (!isActive ? `<span class="result-pending">待公布</span>` : '')}
                        <div class="project-actions">
                            ${project.resultPublished ? `<button class="btn-delete" onclick="deleteParticipatedProject('${project.id}')">删除</button>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

// 全局变量
let app;

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    app = new VotingApp();
});

// 全局函数

// 处理登录
function handleLogin() {
    if (app) {
        app.handleLogin();
    }
}

// 卡片展开/收起
function toggleCard(cardId) {
    const content = document.getElementById(cardId + 'Content');
    const arrow = document.getElementById(cardId + 'Arrow');
    
    if (content && arrow) {
        const isExpanded = content.classList.contains('expanded');
        
        if (isExpanded) {
            content.classList.remove('expanded');
            arrow.classList.remove('expanded');
        } else {
            content.classList.add('expanded');
            arrow.classList.add('expanded');
            
            // 当展开卡片时，刷新相应内容
            if (app) {
                if (cardId === 'myProjects') {
                    app.renderMyProjects();
                } else if (cardId === 'allProjects') {
                    app.renderAllProjects();
                }
            }
        }
    }
}

// 标签页切换
function switchTab(tabName) {
    // 移除所有活动状态
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    
    // 激活选中的标签
    event.target.classList.add('active');
    
    if (tabName === 'created') {
        document.getElementById('createdProjects').classList.add('active');
    } else if (tabName === 'participated') {
        document.getElementById('participatedProjects').classList.add('active');
    }
    
    // 刷新"我的项目"内容
    if (app) {
        app.renderMyProjects();
    }
}

let selectedVoteOption = null;

function selectVoteOption(option) {
    selectedVoteOption = option;
    
    // 移除之前的选中状态
    document.querySelectorAll('.vote-option').forEach(el => {
        el.classList.remove('selected');
    });
    
    // 添加当前选中状态
    const selectedElement = document.getElementById('vote' + (option === 'yes' ? 'Yes' : 'No'));
    selectedElement.classList.add('selected');
    
    // 获取选中选项的剩余积分
    const remainingPoints = parseInt(selectedElement.getAttribute('data-remaining'));
    
    // 更新投票积分输入框的最大值
    const votePointsInput = document.getElementById('votePoints');
    const maxPointsDisplay = document.getElementById('maxPointsDisplay');
    const remainingPointsInfo = document.getElementById('remainingPointsInfo');
    
    if (votePointsInput && maxPointsDisplay && remainingPointsInfo) {
        // 更新最大值为剩余积分和用户积分的较小值
        const maxAllowed = Math.min(remainingPoints, app.userPoints);
        votePointsInput.max = maxAllowed;
        maxPointsDisplay.textContent = maxAllowed;
        
        // 如果当前值超过新的最大值，调整为最大值
        if (parseInt(votePointsInput.value) > maxAllowed) {
            votePointsInput.value = Math.max(1, maxAllowed);
        }
        
        // 更新提示信息
        if (remainingPoints === 0) {
            remainingPointsInfo.textContent = `该选项已达到最大投票积分，无法继续投票`;
            remainingPointsInfo.style.color = '#ff6b6b';
            votePointsInput.disabled = true;
        } else {
            remainingPointsInfo.textContent = `该选项剩余可投积分: ${remainingPoints}，您的积分: ${app.userPoints}`;
            remainingPointsInfo.style.color = 'rgba(255,255,255,0.7)';
            votePointsInput.disabled = false;
        }
    }
}

function submitVote(projectId) {
    if (!selectedVoteOption) {
        alert('请选择投票选项');
        return;
    }
    
    const votePoints = parseInt(document.getElementById('votePoints').value);
    if (!votePoints || votePoints < 1) {
        alert('请输入有效的投票积分');
        return;
    }
    
    app.handleVote(projectId, selectedVoteOption, votePoints);
    selectedVoteOption = null;
}

function showPublishResultModal(projectId) {
    if (!app.currentUser) {
        alert('请先登录');
        return;
    }
    
    app.showPublishResult(projectId);
}

function publishResult(projectId, result) {
    // 显示确认提示
    const resultText = result === 'yes' ? '是' : '否';
    const confirmed = confirm(`确认公布结果为"${resultText}"吗？\n\n注意：结果一旦公布将无法修改，请仔细确认。`);
    
    if (confirmed) {
        app.publishProjectResult(projectId, result);
    }
}

// 显示充值模态框
function showRechargeModal() {
    document.getElementById('rechargeModal').style.display = 'block';
}

// 显示提现模态框
function showWithdrawModal() {
    if (!app.currentUser) {
        alert('请先登录');
        return;
    }
    document.getElementById('withdrawModal').style.display = 'block';
}

function showPointsDetailModal() {
    if (!app.currentUser) {
        alert('请先登录');
        return;
    }
    app.showPointsDetail();
}

// 显示投票模态框
function showVoteModal(projectId) {
    if (!app.currentUser) {
        alert('请先登录');
        return;
    }
    
    const project = app.projects.find(p => p.id === projectId);
    if (!project) return;
    
    const modal = document.getElementById('voteModal');
    const content = document.getElementById('voteContent');
    
    // 判断当前用户是否为项目发起人
    const isCreator = app.currentUser && project.creatorId === app.currentUser.uid;
    
    // 计算参与人数
    const participantCount = [...new Set(project.voteDetails?.map(vote => vote.voter) || [])].length;
    
    // 计算每个选项的剩余可投积分
    const yesVotes = project.votes?.yes || 0;
    const noVotes = project.votes?.no || 0;
    const remainingYesPoints = Math.max(0, project.maxPoints - yesVotes);
    const remainingNoPoints = Math.max(0, project.maxPoints - noVotes);
    
    // 根据用户身份显示不同的信息
    let yesDisplayText, noDisplayText;
    if (isCreator) {
        // 项目发起人显示详细票数和剩余积分
        yesDisplayText = `当前票数: ${yesVotes} (剩余: ${remainingYesPoints})`;
        noDisplayText = `当前票数: ${noVotes} (剩余: ${remainingNoPoints})`;
    } else {
        // 普通用户只显示参与人数
        yesDisplayText = `参与人数: ${participantCount}`;
        noDisplayText = `参与人数: ${participantCount}`;
    }
    
    content.innerHTML = `
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        
        <div class="vote-options-container">
            <div class="vote-option" onclick="selectVoteOption('yes')" id="voteYes" data-remaining="${remainingYesPoints}">
                <span class="option-text">是</span>
                <p>${yesDisplayText}</p>
            </div>
            <div class="vote-option" onclick="selectVoteOption('no')" id="voteNo" data-remaining="${remainingNoPoints}">
                <span class="option-text">否</span>
                <p>${noDisplayText}</p>
            </div>
        </div>
        
        <div class="vote-points-section">
            <label for="votePoints">投票积分 (1-<span id="maxPointsDisplay">${project.maxPoints}</span>) *</label>
            <input type="number" id="votePoints" min="1" max="${project.maxPoints}" value="1" required>
            <p id="remainingPointsInfo" style="font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 5px;">请先选择投票选项</p>
        </div>
        
        <button class="btn btn-primary" onclick="submitVote('${projectId}')">确认投票</button>
    `;
    
    modal.style.display = 'block';
}

// 关闭模态框
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// 点击模态框外部关闭
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};

// 错误处理
window.addEventListener('error', (event) => {
    console.error('应用错误:', event.error);
});

// 删除项目
function deleteProject(projectId) {
    if (!app.currentUser) {
        alert('请先登录');
        return;
    }
    
    const project = app.projects.find(p => p.id === projectId);
    if (!project) {
        alert('项目不存在');
        return;
    }
    
    if (project.creatorId !== app.currentUser.uid) {
        alert('只有项目创建者可以删除项目');
        return;
    }
    
    // 检查是否有人参与投票
    if ((project.voteDetails || []).length > 0) {
        // 如果有人投票，必须先公布结果才能删除
        if (!project.resultPublished) {
            alert('已有人参与投票，请先公布结果后再删除项目');
            return;
        }
    }
    
    // 确认删除
    if (!confirm(`确定要删除项目"${project.title}"吗？删除后将返还冻结的${project.frozenPoints}积分。项目将从您的列表中移除，但其他参与用户仍可查看。`)) {
        return;
    }
    
    // 返还冻结的积分
    const frozenPoints = project.frozenPoints || 0;
    app.userPoints += frozenPoints;
    app.addPointsHistory('project_delete', frozenPoints, `删除项目 - ${project.title}`);
    
    // 将项目添加到当前用户的隐藏列表中，而不是完全删除
    const hiddenProjectKey = `${app.currentUser.uid}_${projectId}`;
    if (!app.hiddenProjects.includes(hiddenProjectKey)) {
        app.hiddenProjects.push(hiddenProjectKey);
    }
    
    // 保存数据并更新显示
    app.saveLocalData();
    app.updateUserPointsDisplay();
    app.renderProjects();
    
    alert(`项目删除成功！已返还${frozenPoints}积分，当前积分：${app.userPoints}`);
}

// 删除参与的项目（从我的参与列表中移除）
function deleteParticipatedProject(projectId) {
    if (!app.currentUser) {
        alert('请先登录');
        return;
    }

    const project = app.projects.find(p => p.id === projectId);
    if (!project) {
        alert('项目不存在');
        return;
    }

    // 只有已公布结果的项目才能从参与列表中删除
    if (!project.resultPublished) {
        alert('只有已公布结果的项目才能删除');
        return;
    }

    // 确认删除
    if (!confirm(`确定要从参与列表中删除项目"${project.title}"吗？项目将从您的列表中隐藏。`)) {
        return;
    }

    // 将项目添加到当前用户的隐藏列表中
    const hiddenProjectKey = `${app.currentUser.uid}_${projectId}`;
    if (!app.hiddenProjects.includes(hiddenProjectKey)) {
        app.hiddenProjects.push(hiddenProjectKey);
    }
    
    app.saveLocalData();
    app.renderProjects();
    
    alert('项目已从参与列表中删除');
}

// 编辑项目
function editProject(projectId) {
    if (!app.currentUser) {
        alert('请先登录');
        return;
    }
    
    const project = app.projects.find(p => p.id === projectId);
    if (!project) {
        alert('项目不存在');
        return;
    }
    
    if (project.creatorId !== app.currentUser.uid) {
        alert('只有项目创建者可以编辑项目');
        return;
    }
    
    // 检查项目是否已结束
    if (new Date() > new Date(project.endTime)) {
        alert('项目已结束，无法编辑');
        return;
    }
    
    // 填充表单数据
    const titleInput = document.getElementById('projectTitle');
    const descInput = document.getElementById('projectDescription');
    const endTimeInput = document.getElementById('endTime');
    const maxPointsInput = document.getElementById('maxPoints');
    
    if (titleInput) titleInput.value = project.title;
    if (descInput) descInput.value = project.description;
    if (endTimeInput) endTimeInput.value = new Date(project.endTime).toISOString().slice(0, 16);
    if (maxPointsInput) maxPointsInput.value = project.maxPoints;
    
    // 展开创建项目卡片
    const createContent = document.getElementById('createProjectContent');
    const createArrow = document.getElementById('createProjectArrow');
    if (createContent && createArrow) {
        createContent.classList.add('expanded');
        createArrow.classList.add('expanded');
    }
    
    // 滚动到创建项目区域
    const createProjectElement = document.getElementById('createProject');
    if (createProjectElement) {
        createProjectElement.scrollIntoView({ behavior: 'smooth' });
    }
    
    // 存储正在编辑的项目ID
    app.editingProjectId = projectId;
    
    // 检查是否需要显示公布结果按钮
    const hasVotes = (project.voteDetails || []).length > 0;
    const resultNotPublished = !project.resultPublished;
    
    // 获取提交按钮
    const submitBtn = document.querySelector('#createProjectForm button[type="submit"]');
    
    // 移除之前可能存在的公布结果按钮
    const existingPublishBtn = document.getElementById('editPublishResultBtn');
    if (existingPublishBtn) {
        existingPublishBtn.remove();
    }
    
    // 如果有投票且结果未公布，将提交按钮替换为公布结果按钮
    if (hasVotes && resultNotPublished) {
        if (submitBtn) {
            submitBtn.textContent = '公布结果';
            submitBtn.type = 'button';
            submitBtn.onclick = (e) => {
                e.preventDefault();
                showPublishResultModal(projectId);
            };
        }
    } else {
         // 如果没有投票或结果已公布，显示取消编辑按钮
         if (submitBtn) {
             submitBtn.textContent = '取消编辑';
             submitBtn.type = 'button';
             submitBtn.onclick = (e) => {
                 e.preventDefault();
                 cancelEdit();
             };
         }
     }
}

// 取消编辑项目
function cancelEdit() {
    if (!app.editingProjectId) {
        return;
    }
    
    // 清除编辑状态
    app.editingProjectId = null;
    
    // 重置表单
    const form = document.getElementById('createProjectForm');
    if (form) {
        form.reset();
    }
    
    // 恢复按钮
    const submitBtn = document.querySelector('#createProjectForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = '创建项目';
        submitBtn.type = 'submit';
        submitBtn.onclick = null;
        submitBtn.style.display = 'block';
    }
    
    // 移除可能存在的公布结果按钮
    const existingPublishBtn = document.getElementById('editPublishResultBtn');
    if (existingPublishBtn) {
        existingPublishBtn.remove();
    }
    
    // 收起创建项目卡片
    const createContent = document.getElementById('createProjectContent');
    const createArrow = document.getElementById('createProjectArrow');
    if (createContent && createArrow) {
        createContent.classList.remove('expanded');
        createArrow.classList.remove('expanded');
    }
    
    alert('已取消编辑');
}

// 导出给全局使用
window.app = app;