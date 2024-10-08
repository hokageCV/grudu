class TasksController < ApplicationController
  before_action :authenticate_user!
  before_action :set_task, only: %i[ show update destroy ]
  before_action :authorize_user!, only: %i[show update destroy]

  # GET /tasks
  def index
    @tasks = Task.from_task_list(params[:task_list_id].to_i)

    render json: @tasks
  end

  # GET /tasks/1
  def show
    render json: @task
  end

  # POST /tasks
  def create
    @task = Task.new(task_params.merge(owner_id: current_user.id))

    if @task.save
      render json: @task, status: :created, location: @task
    else
      render json: @task.errors, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /tasks/1
  def update
    if @task.update(task_params)
      render json: @task
    else
      render json: @task.errors, status: :unprocessable_entity
    end
  end

  # DELETE /tasks/1
  def destroy
    if @task.destroy
      render json: { message: 'Task successfully deleted' }, status: :ok
    else
      render json: { error: 'Failed to delete task' }, status: :unprocessable_entity
    end
  end

  private
  def set_task
    @task = Task.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Task not found' }, status: :not_found
  end

  def task_params
    params.require(:task).permit(:name, :task_list_id, :completed)
  end

  def authorize_user!
    render json: { error: 'unauthorized' }, status: :forbidden unless @task.authorized?(current_user)
  end
end
