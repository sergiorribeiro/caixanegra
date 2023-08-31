# frozen_string_literal: true

module Caixanegra
  class Manager
    class << self
      def handler(flow_definition = {})
        transient_store = Caixanegra.transient_store
        uid = transient_store.new_uid

        transient_store.hold(uid, flow_definition)

        uid
      end

      def get(uid)
        Caixanegra.transient_store.get(uid)
      end

      def set(uid, flow_definition)
        Caixanegra.transient_store.hold(uid, definition: flow_definition)
      end
    end
  end
end
